'use client';

import {
  Users,
  Megaphone,
  Send,
  MessageSquare,
  UserCheck,
  UserX,
} from 'lucide-react';

export interface DashboardStats {
  totalContacts: number;
  activeCampaigns: number;
  touchesSent: number;
  replies: number;
  reactivations: number;
  optOuts: number;
  replyRate: number;
  reactivationRate: number;
  optOutRate: number;
}

interface StatsCardsProps {
  stats: DashboardStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Contacts',
      value: stats.totalContacts.toLocaleString(),
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Active Campaigns',
      value: stats.activeCampaigns.toString(),
      icon: Megaphone,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Touches Sent',
      value: stats.touchesSent.toLocaleString(),
      icon: Send,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Reply Rate',
      value: `${stats.replyRate.toFixed(1)}%`,
      subtitle: `${stats.replies} replies`,
      icon: MessageSquare,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Reactivation Rate',
      value: `${stats.reactivationRate.toFixed(1)}%`,
      subtitle: `${stats.reactivations} reactivated`,
      icon: UserCheck,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Opt-Out Rate',
      value: `${stats.optOutRate.toFixed(1)}%`,
      subtitle: `${stats.optOuts} opted out`,
      icon: UserX,
      color: 'text-red-600 bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{card.label}</span>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            {card.subtitle && (
              <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
