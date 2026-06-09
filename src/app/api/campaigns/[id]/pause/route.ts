import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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

  if (campaign.status !== 'active') {
    return NextResponse.json(
      { error: 'Only active campaigns can be paused' },
      { status: 400 }
    );
  }

  // Clear next_send_at for all contacts in this campaign
  await supabase
    .from('campaign_contacts')
    .update({ next_send_at: null })
    .eq('campaign_id', campaignId);

  // Update campaign status
  const { data: updatedCampaign, error: updateError } = await supabase
    .from('campaigns')
    .update({ status: 'paused' })
    .eq('id', campaignId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ campaign: updatedCampaign });
}
