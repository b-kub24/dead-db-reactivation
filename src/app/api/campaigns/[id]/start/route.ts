import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, CadenceStep } from '@/lib/supabase';
import { addDays } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const campaignId = params.id;

  // Fetch campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  if (campaign.status !== 'draft' && campaign.status !== 'paused') {
    return NextResponse.json(
      { error: 'Campaign can only be started from draft or paused state' },
      { status: 400 }
    );
  }

  const cadence = campaign.cadence as CadenceStep[];
  const now = new Date();

  // Get all campaign contacts
  const { data: campaignContacts, error: ccError } = await supabase
    .from('campaign_contacts')
    .select('*')
    .eq('campaign_id', campaignId);

  if (ccError) {
    return NextResponse.json({ error: ccError.message }, { status: 500 });
  }

  // Set next_send_at for each contact based on their current step
  for (const cc of campaignContacts || []) {
    if (cc.paused) continue;

    const currentStep = cc.current_step;
    if (currentStep >= cadence.length) continue;

    const stepConfig = cadence[currentStep];
    const nextSendAt = campaign.status === 'draft'
      ? addDays(now, stepConfig.day)
      : now; // If resuming from pause, send immediately for current step

    await supabase
      .from('campaign_contacts')
      .update({ next_send_at: nextSendAt.toISOString() })
      .eq('campaign_id', campaignId)
      .eq('contact_id', cc.contact_id);
  }

  // Update contacts status to 'active'
  const contactIds = (campaignContacts || []).map((cc) => cc.contact_id);
  if (contactIds.length > 0) {
    await supabase
      .from('contacts')
      .update({ status: 'active' })
      .in('id', contactIds)
      .eq('status', 'pending');
  }

  // Update campaign status
  const { data: updatedCampaign, error: updateError } = await supabase
    .from('campaigns')
    .update({ status: 'active' })
    .eq('id', campaignId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ campaign: updatedCampaign });
}
