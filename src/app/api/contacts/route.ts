import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const searchParams = request.nextUrl.searchParams;

  const segment = searchParams.get('segment');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '200');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (segment) {
    query = query.eq('segment', segment);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  const { data: contacts, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    contacts: contacts || [],
    total: count || 0,
  });
}
