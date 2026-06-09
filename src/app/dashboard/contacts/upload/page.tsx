'use client';

import { useState } from 'react';
import CSVUploader from '@/components/CSVUploader';

export default function UploadPage() {
  const [, setUploadResult] = useState<{
    totalImported: number;
    segmented: number;
    segments: Record<string, number>;
  } | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Contacts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Import your CRM export and let AI segment your database
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <CSVUploader onUploadComplete={setUploadResult} />
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">CSV Tips</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-medium text-blue-600">1.</span>
            Export contacts from your CRM as CSV (comma-separated values)
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium text-blue-600">2.</span>
            Include at least email or phone number for each contact
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium text-blue-600">3.</span>
            The more data you include (notes, source, last contact date), the better the AI segmentation
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium text-blue-600">4.</span>
            Works with exports from Follow Up Boss, KVCore, BoomTown, Salesforce, HubSpot, and any CSV format
          </li>
        </ul>
      </div>
    </div>
  );
}
