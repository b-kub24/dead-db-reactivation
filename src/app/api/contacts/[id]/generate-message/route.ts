import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateReengagementMessage } from '@/lib/claude';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const contactId = params.id;

  try {
    const body = await request.json();
    const channel: 'sms' | 'email' = body.channel || 'sms';
    const stepNumber: number = body.stepNumber || 0;

    // Fetch contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Fetch user's brand voice
    const { data: user } = await supabase
      .from('users')
      .select('brand_voice, business_name')
      .eq('id', contact.user_id)
      .single();

    const message = await generateReengagementMessage({
      contactFirstName: contact.first_name,
      contactLastName: contact.last_name,
      contactNotes: contact.notes,
      contactSegment: contact.segment,
      contactSource: contact.source,
      lastContactAt: contact.last_contact_at,
      brandVoice: user?.brand_voice || null,
      businessName: user?.business_name || null,
      channel,
      stepNumber,
      totalSteps: 4,
    });

    return NextResponse.json({ message });
  } catch (err) {
    console.error('Message generation error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate message' },
      { status: 500 }
    );
  }
}
