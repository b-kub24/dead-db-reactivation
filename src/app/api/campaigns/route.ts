import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, CadenceStep } from '@/lib/supabase';

export async function GET() {
  const supabase = createServerClient();

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with stats
  const enrichedCampaigns = await Promise.all(
    (campaigns || []).map(async (campaign) => {
      const { count: contactCount } = await supabase
        .from('campaign_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id);

      const { count: touchCount } = await supabase
        .from('touches')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('direction', 'outbound');

      const { count: replyCount } = await supabase
        .from('touches')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('direction', 'inbound');

      return {
        ...campaign,
        contactCount: contactCount || 0,
        touchCount: touchCount || 0,
        replyCount: replyCount || 0,
      };
    })
  );

  return NextResponse.json({ campaigns: enrichedCampaigns });
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const { name, contactIds, cadence }: {
      name: string;
      contactIds: string[];
      cadence?: CadenceStep[];
    } = body;

    if (!name || !contactIds || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'Campaign name and at least one contact are required' },
        { status: 400 }
      );
    }

    // Get user_id from first contact
    const { data: firstContact } = await supabase
      .from('contacts')
      .select('user_id')
      .eq('id', contactIds[0])
      .single();

    if (!firstContact) {
      return NextResponse.json({ error: 'Invalid contact' }, { status: 400 });
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        user_id: firstContact.user_id,
        name,
        status: 'draft',
        cadence: cadence || [
          { day: 0, channel: 'sms' },
          { day: 7, channel: 'email' },
          { day: 21, channel: 'sms' },
          { day: 45, channel: 'email' },
        ],
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: campaignError?.message || 'Failed to create campaign' },
        { status: 500 }
      );
    }

    // Attach contacts to campaign
    const campaignContacts = contactIds.map((contactId) => ({
      campaign_id: campaign.id,
      contact_id: contactId,
      current_step: 0,
      next_send_at: null as string | null,
      paused: false,
    }));

    const { error: attachError } = await supabase
      .from('campaign_contacts')
      .insert(campaignContacts);

    if (attachError) {
      // Clean up campaign if attach fails
      await supabase.from('campaigns').delete().eq('id', campaign.id);
      return NextResponse.json(
        { error: `Failed to attach contacts: ${attachError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ campaign });
  } catch (err) {
    console.error('Campaign creation error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
