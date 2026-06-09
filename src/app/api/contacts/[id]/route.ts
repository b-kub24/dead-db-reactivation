import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const contactId = params.id;

  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (error || !contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  // Fetch touch history for this contact
  const { data: touches } = await supabase
    .from('touches')
    .select('*')
    .eq('contact_id', contactId)
    .order('sent_at', { ascending: true });

  return NextResponse.json({
    contact,
    touches: touches || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const contactId = params.id;
  const body = await request.json();

  const allowedFields = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'last_contact_at',
    'source',
    'notes',
    'segment',
    'status',
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  const { data: contact, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', contactId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const contactId = params.id;

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
