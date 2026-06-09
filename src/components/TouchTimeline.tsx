'use client';

import { Touch } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Send, MessageSquare, Mail, Phone } from 'lucide-react';

interface TouchTimelineProps {
  touches: Touch[];
}

export default function TouchTimeline({ touches }: TouchTimelineProps) {
  if (touches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {touches.map((touch, index) => {
        const isOutbound = touch.direction === 'outbound';
        const isSms = touch.channel === 'sms';
        const isLast = index === touches.length - 1;

        return (
          <div key={touch.id} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-200" />
            )}

            {/* Icon */}
            <div
              className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                isOutbound
                  ? isSms
                    ? 'bg-green-100 text-green-600'
                    : 'bg-blue-100 text-blue-600'
                  : 'bg-purple-100 text-purple-600'
              }`}
            >
              {isOutbound ? (
                isSms ? (
                  <Phone className="w-4 h-4" />
                ) : (
                  <Mail className="w-4 h-4" />
                )
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isOutbound
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-purple-50 text-purple-700'
                  }`}
                >
                  {isOutbound ? 'Sent' : 'Reply'} &middot;{' '}
                  {isSms ? 'SMS' : 'Email'}
                </span>
                <span className="text-xs text-gray-400">
                  Step {touch.step + 1}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(touch.sent_at)}
                </span>
              </div>

              {touch.subject && (
                <p className="text-sm font-medium text-gray-800 mb-1">
                  Subject: {touch.subject}
                </p>
              )}

              <div
                className={`text-sm rounded-lg p-3 ${
                  isOutbound
                    ? 'bg-gray-50 text-gray-700'
                    : 'bg-purple-50 text-purple-900'
                }`}
              >
                {touch.body}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
