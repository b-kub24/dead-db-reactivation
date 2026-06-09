'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Campaign, Contact, Touch, CampaignContact } from '@/lib/supabase';
import { getStatusColor, formatDate, formatPercentage } from '@/lib/utils';
import TouchTimeline from '@/components/TouchTimeline';
import {
  Loader2,
  ArrowLeft,
  Play,
  Pause,
  Users,
  Send,
  MessageSquare,
  UserCheck,
  UserX,
  CheckCircle,
} from 'lucide-react';

interface CampaignDetail {
  campaign: Campaign;
  contacts: (Contact & { campaignContact: CampaignContact })[];
  touches: Touch[];
  stats: {
    totalContacts: number;
    touchesSent: number;
    replies: number;
    reactivated: number;
    optedOut: number;
    completed: number;
    pending: number;
  };
}

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [data, setData] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'touches'>('overview');

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error('Failed to fetch campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/start`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to start campaign:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/pause`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to pause campaign:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Campaign not found</p>
      </div>
    );
  }

  const { campaign, contacts, touches, stats } = data;
  const cadence = campaign.cadence as { day: number; channel: string }[];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to campaigns
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                campaign.status
              )}`}
            >
              {campaign.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Created {formatDate(campaign.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {campaign.status === 'draft' || campaign.status === 'paused' ? (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="btn-primary flex items-center gap-2"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {campaign.status === 'draft' ? 'Start Campaign' : 'Resume Campaign'}
            </button>
          ) : campaign.status === 'active' ? (
            <button
              onClick={handlePause}
              disabled={actionLoading}
              className="btn-secondary flex items-center gap-2"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
              Pause Campaign
            </button>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Contacts', value: stats.totalContacts, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Sent', value: stats.touchesSent, icon: Send, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Replies', value: stats.replies, icon: MessageSquare, color: 'text-green-600 bg-green-50' },
          { label: 'Reactivated', value: stats.reactivated, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Opted Out', value: stats.optedOut, icon: UserX, color: 'text-red-600 bg-red-50' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-gray-600 bg-gray-50' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 rounded flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Cadence */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Drip Cadence</h3>
        <div className="flex flex-wrap items-center gap-2">
          {cadence.map((step, i) => (
            <div key={i} className="flex items-center gap-1">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
                  step.channel === 'sms'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                Day {step.day}: {step.channel.toUpperCase()}
              </span>
              {i < cadence.length - 1 && (
                <span className="text-gray-300 mx-1">&rarr;</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['overview', 'contacts', 'touches'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Campaign Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Reply Rate</span>
                <span className="font-medium">
                  {formatPercentage(stats.replies, stats.totalContacts)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${stats.totalContacts > 0 ? (stats.replies / stats.totalContacts) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Reactivation Rate</span>
                <span className="font-medium">
                  {formatPercentage(stats.reactivated, stats.totalContacts)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${stats.totalContacts > 0 ? (stats.reactivated / stats.totalContacts) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Opt-Out Rate</span>
                <span className="font-medium">
                  {formatPercentage(stats.optedOut, stats.totalContacts)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${stats.totalContacts > 0 ? (stats.optedOut / stats.totalContacts) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Drip Progress</h3>
            <div className="space-y-3">
              {cadence.map((step, i) => {
                const touchesAtStep = touches.filter((t) => t.step === i && t.direction === 'outbound').length;
                const percentage = stats.totalContacts > 0 ? (touchesAtStep / stats.totalContacts) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        Step {i + 1}: Day {step.day} {step.channel.toUpperCase()}
                      </span>
                      <span className="font-medium">{touchesAtStep} sent</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          step.channel === 'sms' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Step</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Send</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paused</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/contacts/${contact.id}`}
                      className="font-medium text-gray-900 hover:text-brand-600"
                    >
                      {contact.first_name || ''} {contact.last_name || ''}
                    </Link>
                    <div className="text-xs text-gray-500">{contact.email || contact.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        contact.status
                      )}`}
                    >
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {contact.campaignContact.current_step + 1} / {cadence.length}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {contact.campaignContact.next_send_at
                      ? formatDate(contact.campaignContact.next_send_at)
                      : 'Complete'}
                  </td>
                  <td className="px-4 py-3">
                    {contact.campaignContact.paused ? (
                      <span className="text-xs text-yellow-600 font-medium">Paused</span>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">Active</span>
                    )}
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                    No contacts in this campaign
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'touches' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <TouchTimeline touches={touches} />
        </div>
      )}
    </div>
  );
}
