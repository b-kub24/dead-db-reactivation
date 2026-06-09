'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatsCards, { DashboardStats } from '@/components/StatsCards';
import { Loader2, Upload, Plus, ArrowRight } from 'lucide-react';

interface RecentActivity {
  id: string;
  type: 'reply' | 'opt_out' | 'touch_sent' | 'reactivated';
  contactName: string;
  campaignName: string;
  message: string;
  timestamp: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentActivity(data.recentActivity || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  const defaultStats: DashboardStats = stats || {
    totalContacts: 0,
    activeCampaigns: 0,
    touchesSent: 0,
    replies: 0,
    reactivations: 0,
    optOuts: 0,
    replyRate: 0,
    reactivationRate: 0,
    optOutRate: 0,
  };

  const isEmpty = defaultStats.totalContacts === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your reactivation campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/contacts/upload"
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </Link>
          <Link
            href="/dashboard/campaigns/new"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        </div>
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-brand-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to ReActivate!
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Upload your CRM export to get started. Our AI will segment your contacts and
            help you create personalized reactivation campaigns.
          </p>
          <Link
            href="/dashboard/contacts/upload"
            className="btn-primary inline-flex items-center gap-2"
          >
            Upload Your First CSV
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          <StatsCards stats={defaultStats} />

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="px-5 py-4 flex items-start gap-3">
                    <div
                      className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                        activity.type === 'reply'
                          ? 'bg-green-500'
                          : activity.type === 'reactivated'
                          ? 'bg-emerald-500'
                          : activity.type === 'opt_out'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.contactName}</span>{' '}
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activity.campaignName} &middot; {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-gray-500">
                No activity yet. Start a campaign to see activity here.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
