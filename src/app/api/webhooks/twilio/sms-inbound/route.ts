import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseTwilioWebhook, twimlResponse, sendSms } from '@/lib/twilio';
import { classifyReplyIntent } from '@/lib/claude';

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const formData = await request.formData();
    const inbound = parseTwilioWebhook(formData);

    const fromPhone = inbound.From;
    const replyBody = inbound.Body.trim();

    if (!fromPhone || !replyBody) {
      return new NextResponse(
        twimlResponse('Thank you for your message.'),
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Find the contact by phone number
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', fromPhone);

    if (!contacts || contacts.length === 0) {
      // Unknown sender — log and ignore
      console.log(`Inbound SMS from unknown number: ${fromPhone}`);
      return new NextResponse(
        twimlResponse('Thank you for your message.'),
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Use the first matching contact (in case of duplicates across users)
    const contact = contacts[0];

    // Find active campaign_contacts for this contact
    const { data: campaignContacts } = await supabase
      .from('campaign_contacts')
      .select('*, campaigns(*)')
      .eq('contact_id', contact.id)
      .eq('paused', false);

    // Find the most recent outbound touch to this contact
    const { data: lastOutbound } = await supabase
      .from('touches')
      .select('*')
      .eq('contact_id', contact.id)
      .eq('direction', 'outbound')
      .eq('channel', 'sms')
      .order('sent_at', { ascending: false })
      .limit(1);

    const lastMessageBody = lastOutbound?.[0]?.body || '';
    const activeCampaignId = lastOutbound?.[0]?.campaign_id || campaignContacts?.[0]?.campaign_id;

    // Classify reply intent using AI
    const classification = await classifyReplyIntent(replyBody, lastMessageBody);

    // Record inbound touch
    if (activeCampaignId) {
      await supabase.from('touches').insert({
        campaign_id: activeCampaignId,
        contact_id: contact.id,
        step: lastOutbound?.[0]?.step || 0,
        channel: 'sms',
        direction: 'inbound',
        body: replyBody,
      });
    }

    // Handle based on intent
    if (classification.intent === 'opt-out') {
      // Update contact status to opted_out
      await supabase
        .from('contacts')
        .update({ status: 'opted_out' })
        .eq('id', contact.id);

      // Pause all drips for this contact
      await supabase
        .from('campaign_contacts')
        .update({ paused: true, next_send_at: null })
        .eq('contact_id', contact.id);

      return new NextResponse(
        twimlResponse(
          "You've been removed from future messages. We apologize for any inconvenience."
        ),
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // For any reply (warm, not-now, neutral), pause the drip
    await supabase
      .from('campaign_contacts')
      .update({ paused: true, next_send_at: null })
      .eq('contact_id', contact.id);

    if (classification.intent === 'warm') {
      // Mark contact as replied/reactivated
      await supabase
        .from('contacts')
        .update({ status: 'reactivated' })
        .eq('id', contact.id);

      // Alert the owner via SMS
      const { data: user } = await supabase
        .from('users')
        .select('phone, business_name')
        .eq('id', contact.user_id)
        .single();

      if (user?.phone) {
        const contactName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'A contact';
        await sendSms({
          to: user.phone,
          body: `WARM LEAD ALERT: ${contactName} (${contact.phone}) replied to your reactivation campaign: "${replyBody.substring(0, 100)}"`,
        });
      }

      return new NextResponse(
        twimlResponse(
          'Great to hear from you! Someone will be in touch shortly.'
        ),
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // not-now or neutral
    await supabase
      .from('contacts')
      .update({ status: 'replied' })
      .eq('id', contact.id);

    // Still alert the owner for any reply
    const { data: user } = await supabase
      .from('users')
      .select('phone, business_name')
      .eq('id', contact.user_id)
      .single();

    if (user?.phone) {
      const contactName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'A contact';
      const intentLabel = classification.intent === 'not-now' ? 'NOT NOW' : 'REPLY';
      await sendSms({
        to: user.phone,
        body: `${intentLabel}: ${contactName} (${contact.phone}) replied: "${replyBody.substring(0, 100)}"`,
      });
    }

    return new NextResponse(
      twimlResponse('Thank you for your response!'),
      { headers: { 'Content-Type': 'text/xml' } }
    );
  } catch (err) {
    console.error('Inbound SMS webhook error:', err);
    return new NextResponse(
      twimlResponse('Thank you for your message.'),
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }
}
