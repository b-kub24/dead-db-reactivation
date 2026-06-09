'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FieldMapping {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  last_contact_at: string | null;
  source: string | null;
  notes: string | null;
}

interface CSVUploaderProps {
  onUploadComplete: (result: {
    totalImported: number;
    segmented: number;
    segments: Record<string, number>;
  }) => void;
}

const FIELD_LABELS: Record<keyof FieldMapping, string> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  last_contact_at: 'Last Contact Date',
  source: 'Lead Source',
  notes: 'Notes / Comments',
};

type UploadStep = 'upload' | 'mapping' | 'processing' | 'complete';

export default function CSVUploader({ onUploadComplete }: CSVUploaderProps) {
  const [step, setStep] = useState<UploadStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({
    first_name: null,
    last_name: null,
    email: null,
    phone: null,
    last_contact_at: null,
    source: null,
    notes: null,
  });
  const [result, setResult] = useState<{
    totalImported: number;
    segmented: number;
    segments: Record<string, number>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);

    const text = await selectedFile.text();
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) {
      setError('CSV file must have a header row and at least one data row');
      return;
    }

    const headerLine = lines[0];
    const parsedHeaders = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    setHeaders(parsedHeaders);

    const preview: Record<string, string>[] = [];
    for (let i = 1; i < Math.min(lines.length, 4); i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      parsedHeaders.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      preview.push(row);
    }
    setPreviewRows(preview);

    // Auto-detect mapping
    const autoMapping: FieldMapping = {
      first_name: null,
      last_name: null,
      email: null,
      phone: null,
      last_contact_at: null,
      source: null,
      notes: null,
    };

    const lowerHeaders = parsedHeaders.map((h) => h.toLowerCase().replace(/[_\-\s]+/g, ''));
    const patterns: Record<keyof FieldMapping, RegExp[]> = {
      first_name: [/^first/, /^fname/, /^givenname/, /^firstname/],
      last_name: [/^last/, /^lname/, /^surname/, /^lastname/],
      email: [/email/, /^e-?mail/, /^mail/],
      phone: [/phone/, /^tel/, /^mobile/, /^cell/],
      last_contact_at: [/lastcontact/, /^lastdate/, /^lasttouched/, /^lastactivity/],
      source: [/source/, /^leadsource/, /^origin/, /^channel/],
      notes: [/notes/, /^comment/, /^description/, /^memo/],
    };

    for (const [field, regexes] of Object.entries(patterns)) {
      for (const regex of regexes) {
        const matchIdx = lowerHeaders.findIndex((h) => regex.test(h));
        if (matchIdx !== -1 && !Object.values(autoMapping).includes(parsedHeaders[matchIdx])) {
          autoMapping[field as keyof FieldMapping] = parsedHeaders[matchIdx];
          break;
        }
      }
    }

    setMapping(autoMapping);
    setStep('mapping');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleSubmitMapping = async () => {
    if (!file) return;

    setStep('processing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));

      const response = await fetch('/api/contacts/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setResult(data);
      setStep('complete');
      onUploadComplete(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStep('mapping');
    }
  };

  if (step === 'upload') {
    return (
      <div className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-brand-500 bg-brand-50'
              : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Drop your CSV file here
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            or click to browse files
          </p>
          <p className="text-xs text-gray-400">
            Supports CRM exports from Follow Up Boss, KVCore, BoomTown, Salesforce, HubSpot, and more
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
            className="hidden"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    );
  }

  if (step === 'mapping') {
    return (
      <div className="space-y-6">
        {/* File info */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-brand-600" />
            <div>
              <p className="font-medium text-gray-900">{file?.name}</p>
              <p className="text-sm text-gray-500">
                {headers.length} columns detected &middot; {previewRows.length}+ rows
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStep('upload');
              setFile(null);
              setHeaders([]);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Field mapping */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Map Your Fields</h3>
          <p className="text-sm text-gray-500 mb-4">
            We auto-detected some mappings. Adjust as needed.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.keys(FIELD_LABELS) as Array<keyof FieldMapping>).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {FIELD_LABELS[field]}
                  {(field === 'email' || field === 'phone') && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <select
                  value={mapping[field] || ''}
                  onChange={(e) =>
                    setMapping((prev) => ({
                      ...prev,
                      [field]: e.target.value || null,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="">-- Skip this field --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        {previewRows.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview (first {previewRows.length} rows)</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-gray-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                          {row[h] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setStep('upload');
              setFile(null);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleSubmitMapping}
            disabled={!mapping.email && !mapping.phone}
            className="px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload & Segment with AI
          </button>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-12 h-12 mx-auto text-brand-600 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Processing your contacts...</h3>
        <p className="text-sm text-gray-500">
          Parsing CSV, cleaning data, and running AI segmentation. This may take a moment.
        </p>
      </div>
    );
  }

  if (step === 'complete' && result) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Complete!</h3>
        <p className="text-gray-600 mb-6">
          {result.totalImported} contacts imported and {result.segmented} segmented by AI
        </p>

        {Object.keys(result.segments).length > 0 && (
          <div className="max-w-md mx-auto mb-8">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Segment Breakdown</h4>
            <div className="space-y-2">
              {Object.entries(result.segments)
                .sort(([, a], [, b]) => b - a)
                .map(([segment, count]) => (
                  <div key={segment} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{segment}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-3">
          <a
            href="/dashboard/contacts"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            View Contacts
          </a>
          <a
            href="/dashboard/campaigns/new"
            className="px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
          >
            Create Campaign
          </a>
        </div>
      </div>
    );
  }

  return null;
}
