'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ContactTable from '@/components/ContactTable';
import { Contact, CadenceStep } from '@/lib/supabase';
import { Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

const DEFAULT_CADENCE: CadenceStep[] = [
  { day: 0, channel: 'sms' },
  { day: 7, channel: 'email' },
  { day: 21, channel: 'sms' },
  { day: 45, channel: 'email' },
];

const SEGMENT_OPTIONS = [
  'all',
  'hot-dormant',
  'warm-dormant',
  'cold-dormant',
  'past-client',
  'referral-source',
  'sphere-of-influence',
  'event-lead',
  'online-lead',
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [cadence, setCadence] = useState<CadenceStep[]>(DEFAULT_CADENCE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const params = new URLSearchParams();
        if (segmentFilter !== 'all') params.set('segment', segmentFilter);
        params.set('status', 'pending');

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
  }, [segmentFilter]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  };

  const addCadenceStep = () => {
    const lastDay = cadence.length > 0 ? cadence[cadence.length - 1].day : 0;
    setCadence([...cadence, { day: lastDay + 14, channel: 'sms' }]);
  };

  const removeCadenceStep = (index: number) => {
    setCadence(cadence.filter((_, i) => i !== index));
  };

  const updateCadenceStep = (index: number, field: keyof CadenceStep, value: number | string) => {
    setCadence(
      cadence.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      )
    );
  };

  const handleCreate = async () => {
    if (!campaignName.trim()) {
      setError('Campaign name is required');
      return;
    }
    if (selectedIds.size === 0) {
      setError('Select at least one contact');
      return;
    }
    if (cadence.length === 0) {
      setError('Add at least one cadence step');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          contactIds: Array.from(selectedIds),
          cadence,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create campaign');
      }

      const data = await response.json();
      router.push(`/dashboard/campaigns/${data.campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to campaigns
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select contacts and customize your reactivation drip
        </p>
      </div>

      {/* Campaign Name */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Campaign Name
        </label>
        <input
          type="text"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          placeholder="e.g., Q1 2025 Database Reactivation"
          className="input-field max-w-md"
        />
      </div>

      {/* Cadence Builder */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Drip Cadence</h2>
            <p className="text-sm text-gray-500">Define when and how each touch is sent</p>
          </div>
          <button onClick={addCadenceStep} className="btn-secondary flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" />
            Add Step
          </button>
        </div>

        <div className="space-y-3">
          {cadence.map((step, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-500 w-16">Step {index + 1}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Day</span>
                <input
                  type="number"
                  value={step.day}
                  onChange={(e) => updateCadenceStep(index, 'day', parseInt(e.target.value) || 0)}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  min={0}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">via</span>
                <select
                  value={step.channel}
                  onChange={(e) => updateCadenceStep(index, 'channel', e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                >
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </div>
              {cadence.length > 1 && (
                <button
                  onClick={() => removeCadenceStep(index)}
                  className="ml-auto text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Select Contacts</h2>
            <p className="text-sm text-gray-500">
              {selectedIds.size} of {contacts.length} contacts selected
            </p>
          </div>
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {SEGMENT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Segments' : s}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
          </div>
        ) : (
          <ContactTable
            contacts={contacts}
            showCampaignActions
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
          />
        )}
      </div>

      {/* Error + Submit */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Link href="/dashboard/campaigns" className="btn-secondary">
          Cancel
        </Link>
        <button
          onClick={handleCreate}
          disabled={creating || selectedIds.size === 0 || !campaignName.trim()}
          className="btn-primary flex items-center gap-2"
        >
          {creating && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Campaign ({selectedIds.size} contacts)
        </button>
      </div>
    </div>
  );
}
