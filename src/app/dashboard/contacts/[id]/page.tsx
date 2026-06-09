'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Contact, Touch } from '@/lib/supabase';
import { getSegmentColor, getStatusColor, formatDate, formatRelativeDate } from '@/lib/utils';
import TouchTimeline from '@/components/TouchTimeline';
import MessagePreview from '@/components/MessagePreview';
import { Loader2, ArrowLeft, Mail, Phone, MapPin, Tag, Calendar } from 'lucide-react';

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;
  const [contact, setContact] = useState<Contact | null>(null);
  const [touches, setTouches] = useState<Touch[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewChannel, setPreviewChannel] = useState<'sms' | 'email'>('sms');

  useEffect(() => {
    async function fetchContact() {
      try {
        const response = await fetch(`/api/contacts/${contactId}`);
        if (response.ok) {
          const data = await response.json();
          setContact(data.contact);
          setTouches(data.touches || []);
        }
      } catch (err) {
        console.error('Failed to fetch contact:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchContact();
  }, [contactId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Contact not found</p>
        <Link href="/dashboard/contacts" className="text-brand-600 hover:text-brand-700 text-sm mt-2 inline-block">
          Back to contacts
        </Link>
      </div>
    );
  }

  const contactName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown';

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/contacts"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to contacts
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Contact info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-gray-900">{contactName}</h1>
              <div className="flex items-center gap-2 mt-2">
                {contact.segment && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSegmentColor(
                      contact.segment
                    )}`}
                  >
                    {contact.segment}
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    contact.status
                  )}`}
                >
                  {contact.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{contact.phone}</span>
                </div>
              )}
              {contact.source && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{contact.source}</span>
                </div>
              )}
              {contact.last_contact_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    Last contact: {formatDate(contact.last_contact_at)} ({formatRelativeDate(contact.last_contact_at)})
                  </span>
                </div>
              )}
            </div>

            {contact.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Notes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
          </div>

          {/* Message Preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setPreviewChannel('sms')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                  previewChannel === 'sms'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                SMS Preview
              </button>
              <button
                onClick={() => setPreviewChannel('email')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                  previewChannel === 'email'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Email Preview
              </button>
            </div>
            <MessagePreview
              contactId={contact.id}
              contactName={contactName}
              channel={previewChannel}
            />
          </div>
        </div>

        {/* Right column - Touch history */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Touch History ({touches.length})
            </h2>
            <TouchTimeline touches={touches} />
          </div>
        </div>
      </div>
    </div>
  );
}
