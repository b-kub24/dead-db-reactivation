import Papa from 'papaparse';

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export interface FieldMapping {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  last_contact_at: string | null;
  source: string | null;
  notes: string | null;
}

export interface MappedContact {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  last_contact_at: string | null;
  source: string | null;
  notes: string | null;
}

export function parseCSV(csvContent: string): CSVParseResult {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  return {
    headers: result.meta.fields || [],
    rows: result.data,
    totalRows: result.data.length,
  };
}

export function applyFieldMapping(
  rows: Record<string, string>[],
  mapping: FieldMapping
): MappedContact[] {
  return rows.map((row) => ({
    first_name: mapping.first_name ? cleanValue(row[mapping.first_name]) : null,
    last_name: mapping.last_name ? cleanValue(row[mapping.last_name]) : null,
    email: mapping.email ? cleanEmail(row[mapping.email]) : null,
    phone: mapping.phone ? cleanPhone(row[mapping.phone]) : null,
    last_contact_at: mapping.last_contact_at ? cleanDate(row[mapping.last_contact_at]) : null,
    source: mapping.source ? cleanValue(row[mapping.source]) : null,
    notes: mapping.notes ? cleanValue(row[mapping.notes]) : null,
  }));
}

export function autoDetectMapping(headers: string[]): FieldMapping {
  const mapping: FieldMapping = {
    first_name: null,
    last_name: null,
    email: null,
    phone: null,
    last_contact_at: null,
    source: null,
    notes: null,
  };

  const lowerHeaders = headers.map((h) => h.toLowerCase().replace(/[_\-\s]+/g, ''));

  const patterns: Record<keyof FieldMapping, RegExp[]> = {
    first_name: [/^first/, /^fname/, /^givenname/, /^firstname/],
    last_name: [/^last/, /^lname/, /^surname/, /^lastname/, /^familyname/],
    email: [/email/, /^e-mail/, /^mail/],
    phone: [/phone/, /^tel/, /^mobile/, /^cell/, /^sms/],
    last_contact_at: [/lastcontact/, /^lastdate/, /^lasttouched/, /^lastactivity/, /^datemodified/],
    source: [/source/, /^leadsource/, /^origin/, /^channel/, /^referral/],
    notes: [/notes/, /^comment/, /^description/, /^memo/, /^detail/],
  };

  for (const [field, regexes] of Object.entries(patterns)) {
    for (const regex of regexes) {
      const matchIdx = lowerHeaders.findIndex((h) => regex.test(h));
      if (matchIdx !== -1 && !Object.values(mapping).includes(headers[matchIdx])) {
        mapping[field as keyof FieldMapping] = headers[matchIdx];
        break;
      }
    }
  }

  return mapping;
}

function cleanValue(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanEmail(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed.includes('@')) return null;
  return trimmed;
}

function cleanPhone(value: string | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

function cleanDate(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}
