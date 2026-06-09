import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, CadenceStep } from '@/lib/supabase';
import { generateReengagementMessage } from '@/lib/claude';
import { sendSms } from '@/lib/twilio';
import { sendEmail, wrapEmailHtml } from '@/lib/resend';
import { addDays } from '@/lib/utils';

export const maxDuration = 300; // 5 min max for Vercel Pro

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runDispatch();
}

export async function POST(request: NextRequest) {
  // Also support POST for manual triggering
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runDispatch();
}

async function runDispatch(): Promise<NextResponse> {
  const supabase = createServerClient();
  const now = new Date().toISOString();
  let touchesSent = 0;
  let errors = 0;

  try {
    // Find all campaign contacts due for a touch
    // next_send_at <= now, not paused, campaign is active
    const { data: dueTouches, error: queryError } = await supabase
      .from('campaign_contacts')
      .select('*')
      .lte('next_send_at', now)
      .eq('paused', false)
      .not('next_send_at', 'is', null);

    if (queryError) {
      console.error('Dispatch query error:', queryError);
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    if (!dueTouches || dueTouches.length === 0) {
      return NextResponse.json({ message: 'No touches due', touchesSent: 0 });
    }

    // Group by campaign for efficient processing
    const byCampaign = new Map<string, typeof dueTouches>();
    for (const cc of dueTouches) {
      const existing = byCampaign.get(cc.campaign_id) || [];
      existing.push(cc);
      byCampaign.set(cc.campaign_id, existing);
    }

    for (const [campaignId, contacts] of byCampaign) {
      // Verify campaign is still active
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('status', 'active')
        .single();

      if (!campaign) continue;

      const cadence = campaign.cadence as CadenceStep[];

      // Fetch user info for brand voice
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', campaign.user_id)
        .single();

      for (const cc of contacts) {
        try {
          const currentStep = cc.current_step;

          // Skip if all steps completed
          if (currentStep >= cadence.length) {
            await supabase
              .from('campaign_contacts')
              .update({ next_send_at: null })
              .eq('campaign_id', campaignId)
              .eq('contact_id', cc.contact_id);
            continue;
          }

          const stepConfig = cadence[currentStep];

          // Fetch contact details
          const { data: contact } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', cc.contact_id)
            .single();

          if (!contact) continue;

          // Skip if contact has opted out or already replied
          if (contact.status === 'opted_out' || contact.status === 'replied' || contact.status === 'reactivated') {
            await supabase
              .from('campaign_contacts')
              .update({ paused: true, next_send_at: null })
              .eq('campaign_id', campaignId)
              .eq('contact_id', cc.contact_id);
            continue;
          }

          // Check channel requirements
          if (stepConfig.channel === 'sms' && !contact.phone) {
            // Skip SMS step if no phone, advance to next
            await advanceStep(supabase, campaignId, cc.contact_id, currentStep, cadence);
            continue;
          }
          if (stepConfig.channel === 'email' && !contact.email) {
            // Skip email step if no email, advance to next
            await advanceStep(supabase, campaignId, cc.contact_id, currentStep, cadence);
            continue;
          }

          // Generate personalized message via Claude
          const message = await generateReengagementMessage({
            contactFirstName: contact.first_name,
            contactLastName: contact.last_name,
            contactNotes: contact.notes,
            contactSegment: contact.segment,
            contactSource: contact.source,
            lastContactAt: contact.last_contact_at,
            brandVoice: user?.brand_voice || null,
            businessName: user?.business_name || null,
            channel: stepConfig.channel as 'sms' | 'email',
            stepNumber: currentStep,
            totalSteps: cadence.length,
          });

          // Send message
          if (stepConfig.channel === 'sms' && contact.phone) {
            await sendSms({
              to: contact.phone,
              body: message.body,
              from: user?.twilio_number || undefined,
            });
          } else if (stepConfig.channel === 'email' && contact.email) {
            const htmlBody = wrapEmailHtml(
              message.body.replace(/\n/g, '<br>'),
              user?.business_name || 'ReActivate'
            );
            await sendEmail({
              to: contact.email,
              subject: message.subject || `Quick note from ${user?.business_name || 'us'}`,
              html: htmlBody,
            });
          }

          // Record touch
          await supabase.from('touches').insert({
            campaign_id: campaignId,
            contact_id: cc.contact_id,
            step: currentStep,
            channel: stepConfig.channel as 'sms' | 'email',
            direction: 'outbound',
            body: message.body,
            subject: message.subject || null,
          });

          // Advance step
          await advanceStep(supabase, campaignId, cc.contact_id, currentStep, cadence);

          touchesSent++;
        } catch (contactError) {
          console.error(
            `Error dispatching to contact ${cc.contact_id}:`,
            contactError
          );
          errors++;
        }
      }
    }

    return NextResponse.json({
      message: `Dispatch complete`,
      touchesSent,
      errors,
    });
  } catch (err) {
    console.error('Dispatch error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Dispatch failed' },
      { status: 500 }
    );
  }
}

async function advanceStep(
  supabase: ReturnType<typeof createServerClient>,
  campaignId: string,
  contactId: string,
  currentStep: number,
  cadence: CadenceStep[]
): Promise<void> {
  const nextStep = currentStep + 1;

  if (nextStep >= cadence.length) {
    // All steps complete
    await supabase
      .from('campaign_contacts')
      .update({
        current_step: nextStep,
        next_send_at: null,
      })
      .eq('campaign_id', campaignId)
      .eq('contact_id', contactId);
    return;
  }

  // Calculate next send time based on the difference between cadence days
  const currentDay = cadence[currentStep].day;
  const nextDay = cadence[nextStep].day;
  const daysBetween = nextDay - currentDay;
  const nextSendAt = addDays(new Date(), daysBetween);

  await supabase
    .from('campaign_contacts')
    .update({
      current_step: nextStep,
      next_send_at: nextSendAt.toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('contact_id', contactId);
}
