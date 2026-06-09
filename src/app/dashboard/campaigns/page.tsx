'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CampaignCard from '@/components/CampaignCard';
import { Campaign } from '@/lib/supabase';
import { Loader2, Plus, Megaphone } from 'lucide-react';

interface CampaignWithStats extends Campaign {
  contactCount: number;
  touchCount: number;
  replyCount: number;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const response = await fetch('/api/campaigns');
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data.campaigns);
        }
      } catch (err) {
        console.error('Failed to fetch campaigns:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h2>
          <p className="text-gray-500 mb-4 text-sm">
            Create your first reactivation campaign to start re-engaging your dormant contacts.
          </p>
          <Link
            href="/dashboard/campaigns/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              contactCount={campaign.contactCount}
              touchCount={campaign.touchCount}
              replyCount={campaign.replyCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
