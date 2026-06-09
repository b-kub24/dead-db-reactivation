'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, Phone, Mail } from 'lucide-react';

interface MessagePreviewProps {
  contactId: string;
  contactName: string;
  channel: 'sms' | 'email';
  onMessageGenerated?: (message: { subject?: string; body: string }) => void;
}

export default function MessagePreview({
  contactId,
  contactName,
  channel,
  onMessageGenerated,
}: MessagePreviewProps) {
  const [message, setMessage] = useState<{ subject?: string; body: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMessage = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contacts/${contactId}/generate-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate message');
      }

      const data = await response.json();
      setMessage(data.message);
      onMessageGenerated?.(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {channel === 'sms' ? (
            <Phone className="w-4 h-4 text-green-600" />
          ) : (
            <Mail className="w-4 h-4 text-blue-600" />
          )}
          <h3 className="text-sm font-medium text-gray-900">
            AI Message Preview ({channel.toUpperCase()})
          </h3>
        </div>
        <button
          onClick={generateMessage}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {message ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      <div className="p-4">
        {!message && !loading && !error && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-3">
              Generate a personalized {channel === 'sms' ? 'text message' : 'email'} for {contactName}
            </p>
            <button
              onClick={generateMessage}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
            >
              Generate with AI
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-6">
            <Loader2 className="w-8 h-8 mx-auto text-brand-600 animate-spin mb-2" />
            <p className="text-sm text-gray-500">Generating personalized message...</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {message && !loading && (
          <div className="space-y-3">
            {message.subject && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Subject</span>
                <p className="text-sm text-gray-900 mt-0.5">{message.subject}</p>
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">Message</span>
              <div
                className={`mt-1 p-3 rounded-lg text-sm whitespace-pre-wrap ${
                  channel === 'sms'
                    ? 'bg-green-50 text-green-900'
                    : 'bg-blue-50 text-blue-900'
                }`}
              >
                {message.body}
              </div>
              {channel === 'sms' && (
                <p className="text-xs text-gray-400 mt-1">
                  {message.body.length} / 160 characters
                  {message.body.length > 160 && (
                    <span className="text-red-500 ml-1">(over limit)</span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
