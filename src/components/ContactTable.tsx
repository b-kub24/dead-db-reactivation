'use client';

import Link from 'next/link';
import { Contact } from '@/lib/supabase';
import { getSegmentColor, getStatusColor, formatRelativeDate, truncateText } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface ContactTableProps {
  contacts: Contact[];
  showCampaignActions?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
}

export default function ContactTable({
  contacts,
  showCampaignActions = false,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: ContactTableProps) {
  const allSelected = selectedIds && contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {showCampaignActions && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Segment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              {!showCampaignActions && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                {showCampaignActions && (
                  <td className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(contact.id) || false}
                      onChange={() => onToggleSelect?.(contact.id)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {contact.first_name || ''} {contact.last_name || ''}
                      {!contact.first_name && !contact.last_name && (
                        <span className="text-gray-400 italic">No name</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {contact.email && <span>{contact.email}</span>}
                      {contact.email && contact.phone && <span> &middot; </span>}
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {contact.segment ? (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSegmentColor(
                        contact.segment
                      )}`}
                    >
                      {contact.segment}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      contact.status
                    )}`}
                  >
                    {contact.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatRelativeDate(contact.last_contact_at)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {contact.source ? truncateText(contact.source, 20) : '-'}
                </td>
                {!showCampaignActions && (
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/contacts/${contact.id}`}
                      className="text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 text-sm"
                    >
                      View
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                )}
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td
                  colSpan={showCampaignActions ? 6 : 7}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  No contacts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
