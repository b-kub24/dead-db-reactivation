'use client';

import Link from 'next/link';
import { Campaign } from '@/lib/supabase';
import { getStatusColor, formatDate } from '@/lib/utils';
import { ChevronRight, Users, Send, MessageSquare } from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
  contactCount?: number;
  touchCount?: number;
  replyCount?: number;
}

export default function CampaignCard({
  campaign,
  contactCount = 0,
  touchCount = 0,
  replyCount = 0,
}: CampaignCardProps) {
  const cadence = campaign.cadence as { day: number; channel: string }[];

  return (
    <Link
      href={`/dashboard/campaigns/${campaign.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Created {formatDate(campaign.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              campaign.status
            )}`}
          >
            {campaign.status}
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-gray-400" />
          <span>{contactCount} contacts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Send className="w-4 h-4 text-gray-400" />
          <span>{touchCount} sent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span>{replyCount} replies</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-gray-500">Cadence:</span>
        <div className="flex items-center gap-1">
          {cadence.map((step, i) => (
            <span
              key={i}
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                step.channel === 'sms'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-blue-50 text-blue-700'
              }`}
            >
              D{step.day} {step.channel.toUpperCase()}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
