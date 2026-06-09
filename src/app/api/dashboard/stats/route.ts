import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { formatRelativeDate } from '@/lib/utils';

export async function GET() {
  const supabase = createServerClient();

  try {
    // Total contacts
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    // Active campaigns
    const { count: activeCampaigns } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Touches sent (outbound)
    const { count: touchesSent } = await supabase
      .from('touches')
      .select('*', { count: 'exact', head: true })
      .eq('direction', 'outbound');

    // Replies (inbound)
    const { count: replies } = await supabase
      .from('touches')
      .select('*', { count: 'exact', head: true })
      .eq('direction', 'inbound');

    // Reactivations
    const { count: reactivations } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'reactivated');

    // Opt-outs
    const { count: optOuts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'opted_out');

    const total = totalContacts || 0;
    const sent = touchesSent || 0;
    const replyCount = replies || 0;
    const reactivationCount = reactivations || 0;
    const optOutCount = optOuts || 0;

    const stats = {
      totalContacts: total,
      activeCampaigns: activeCampaigns || 0,
      touchesSent: sent,
      replies: replyCount,
      reactivations: reactivationCount,
      optOuts: optOutCount,
      replyRate: sent > 0 ? (replyCount / sent) * 100 : 0,
      reactivationRate: total > 0 ? (reactivationCount / total) * 100 : 0,
      optOutRate: total > 0 ? (optOutCount / total) * 100 : 0,
    };

    // Recent activity (last 20 touches)
    const { data: recentTouches } = await supabase
      .from('touches')
      .select('*, contacts(first_name, last_name, status), campaigns(name)')
      .eq('direction', 'inbound')
      .order('sent_at', { ascending: false })
      .limit(20);

    const recentActivity = (recentTouches || []).map((touch) => {
      const contact = touch.contacts as unknown as { first_name: string | null; last_name: string | null; status: string } | null;
      const campaign = touch.campaigns as unknown as { name: string } | null;
      const contactName = contact
        ? [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown'
        : 'Unknown';

      let type: 'reply' | 'opt_out' | 'reactivated' | 'touch_sent' = 'reply';
      let message = 'replied to your message';

      if (contact?.status === 'opted_out') {
        type = 'opt_out';
        message = 'opted out of messages';
      } else if (contact?.status === 'reactivated') {
        type = 'reactivated';
        message = 'was reactivated (warm reply!)';
      }

      return {
        id: touch.id,
        type,
        contactName,
        campaignName: campaign?.name || 'Unknown Campaign',
        message,
        timestamp: formatRelativeDate(touch.sent_at),
      };
    });

    return NextResponse.json({ stats, recentActivity });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
