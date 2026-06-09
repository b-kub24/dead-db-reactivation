import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
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

  // Fetch campaign contacts with contact details
  const { data: campaignContacts } = await supabase
    .from('campaign_contacts')
    .select('*')
    .eq('campaign_id', campaignId);

  const contactIds = (campaignContacts || []).map((cc) => cc.contact_id);

  let contacts: (typeof campaignContacts extends (infer T)[] | null ? T : never)[] = [];
  if (contactIds.length > 0) {
    const { data: contactData } = await supabase
      .from('contacts')
      .select('*')
      .in('id', contactIds);

    contacts = (contactData || []).map((contact) => {
      const cc = campaignContacts?.find((cc) => cc.contact_id === contact.id);
      return {
        ...contact,
        campaignContact: cc || {
          campaign_id: campaignId,
          contact_id: contact.id,
          current_step: 0,
          next_send_at: null,
          paused: false,
        },
      };
    });
  }

  // Fetch touches
  const { data: touches } = await supabase
    .from('touches')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('sent_at', { ascending: false });

  // Calculate stats
  const outboundTouches = (touches || []).filter((t) => t.direction === 'outbound');
  const inboundTouches = (touches || []).filter((t) => t.direction === 'inbound');

  const repliedContactIds = new Set(inboundTouches.map((t) => t.contact_id));
  const reactivatedContacts = contacts.filter((c) => c.status === 'reactivated');
  const optedOutContacts = contacts.filter((c) => c.status === 'opted_out');

  const cadence = campaign.cadence as { day: number; channel: string }[];
  const completedContacts = contacts.filter(
    (c) => c.campaignContact.current_step >= cadence.length
  );

  const stats = {
    totalContacts: contacts.length,
    touchesSent: outboundTouches.length,
    replies: repliedContactIds.size,
    reactivated: reactivatedContacts.length,
    optedOut: optedOutContacts.length,
    completed: completedContacts.length,
    pending: contacts.length - completedContacts.length - optedOutContacts.length,
  };

  return NextResponse.json({
    campaign,
    contacts,
    touches: touches || [],
    stats,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const campaignId = params.id;
  const body = await request.json();

  const allowedFields = ['name', 'status', 'cadence'];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', campaignId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaign });
}
