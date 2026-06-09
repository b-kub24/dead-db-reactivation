import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, ContactInsert } from '@/lib/supabase';
import { parseCSV, applyFieldMapping, FieldMapping } from '@/lib/csv-parser';
import { segmentContacts, SegmentationInput } from '@/lib/claude';

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mappingStr = formData.get('mapping') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!mappingStr) {
      return NextResponse.json({ error: 'No field mapping provided' }, { status: 400 });
    }

    const mapping: FieldMapping = JSON.parse(mappingStr);

    // Require at least email or phone mapping
    if (!mapping.email && !mapping.phone) {
      return NextResponse.json(
        { error: 'At least email or phone field must be mapped' },
        { status: 400 }
      );
    }

    // Parse CSV
    const csvContent = await file.text();
    const parsed = parseCSV(csvContent);

    if (parsed.totalRows === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Apply field mapping
    const mappedContacts = applyFieldMapping(parsed.rows, mapping);

    // Filter out contacts with no email AND no phone
    const validContacts = mappedContacts.filter((c) => c.email || c.phone);

    if (validContacts.length === 0) {
      return NextResponse.json(
        { error: 'No valid contacts found (each contact needs at least an email or phone)' },
        { status: 400 }
      );
    }

    // For now, use a placeholder user_id. In production, this comes from auth.
    // We'll use the first user or create a default one.
    const { data: users } = await supabase.from('users').select('id').limit(1);
    let userId: string;

    if (users && users.length > 0) {
      userId = users[0].id;
    } else {
      // In production, you'd get this from the auth session
      // For demo purposes, we'll return an error
      return NextResponse.json(
        { error: 'No authenticated user found. Please sign in first.' },
        { status: 401 }
      );
    }

    // Insert contacts into database
    const contactInserts: ContactInsert[] = validContacts.map((c) => ({
      user_id: userId,
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      phone: c.phone,
      last_contact_at: c.last_contact_at,
      source: c.source,
      notes: c.notes,
      status: 'pending' as const,
    }));

    const { data: insertedContacts, error: insertError } = await supabase
      .from('contacts')
      .insert(contactInserts)
      .select();

    if (insertError) {
      return NextResponse.json({ error: `Failed to insert contacts: ${insertError.message}` }, { status: 500 });
    }

    // Run AI segmentation in batches of 20
    const batchSize = 20;
    const segments: Record<string, number> = {};
    let segmentedCount = 0;

    for (let i = 0; i < insertedContacts.length; i += batchSize) {
      const batch = insertedContacts.slice(i, i + batchSize);

      const segmentationInputs: SegmentationInput[] = batch.map((c) => ({
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email,
        phone: c.phone,
        lastContactAt: c.last_contact_at,
        source: c.source,
        notes: c.notes,
      }));

      try {
        const results = await segmentContacts(segmentationInputs);

        // Update each contact with its segment
        for (let j = 0; j < batch.length && j < results.length; j++) {
          const segment = results[j].segment;

          await supabase
            .from('contacts')
            .update({ segment })
            .eq('id', batch[j].id);

          segments[segment] = (segments[segment] || 0) + 1;
          segmentedCount++;
        }
      } catch (segError) {
        console.error('Segmentation batch error:', segError);
        // Continue with next batch even if one fails
      }
    }

    return NextResponse.json({
      totalImported: insertedContacts.length,
      segmented: segmentedCount,
      segments,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
