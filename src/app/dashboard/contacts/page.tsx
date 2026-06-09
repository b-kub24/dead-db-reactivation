'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ContactTable from '@/components/ContactTable';
import { Contact } from '@/lib/supabase';
import { Loader2, Upload, Search, Filter } from 'lucide-react';

const SEGMENTS = [
  'all',
  'hot-dormant',
  'warm-dormant',
  'cold-dormant',
  'past-client',
  'referral-source',
  'sphere-of-influence',
  'event-lead',
  'online-lead',
  'unknown',
];

const STATUSES = [
  'all',
  'pending',
  'active',
  'replied',
  'opted_out',
  'reactivated',
  'dead',
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchContacts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (segment !== 'all') params.set('segment', segment);
        if (status !== 'all') params.set('status', status);
        if (search) params.set('search', search);

        const response = await fetch(`/api/contacts?${params}`);
        if (response.ok) {
          const data = await response.json();
          setContacts(data.contacts);
        }
      } catch (err) {
        console.error('Failed to fetch contacts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, [segment, status, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {contacts.length} contacts in your database
          </p>
        </div>
        <Link
          href="/dashboard/contacts/upload"
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <Upload className="w-4 h-4" />
          Upload CSV
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Segments' : s}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : (
        <ContactTable contacts={contacts} />
      )}
    </div>
  );
}
