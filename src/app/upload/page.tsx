'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = [
  'Blood Sugar / Diabetes',
  'Cholesterol / Lipid Profile',
  'Blood Count (CBC)',
  'Blood Pressure',
  'Kidney Function',
  'Liver Function (LFT)',
  'Thyroid (TSH/T3/T4)',
  'Vitamin Profile',
  'Prescription',
  'X-Ray / Scan Report',
  'Other',
];

export default function UploadPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ extracted: number } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/');
    });
  }, [supabase, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !category) {
      setError('Please select a file and category');
      return;
    }

    setError('');
    setLoading(true);

    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    if (reportDate) form.append('report_date', reportDate);

    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Upload failed');
      setLoading(false);
      return;
    }

    setResult({ extracted: data.extracted_count });
    setLoading(false);
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Report Uploaded!</h2>
          <p className="text-gray-500 text-sm mb-6">
            {result.extracted > 0
              ? `${result.extracted} medical values were automatically extracted.`
              : 'Report saved. Values could not be auto-extracted — you can view the raw text on the dashboard.'}
          </p>
          <div className="space-y-3">
            <button onClick={() => router.push('/dashboard')}
              className="w-full py-3 rounded-xl bg-brand-700 text-white font-semibold">
              View Dashboard
            </button>
            <button onClick={() => { setFile(null); setPreview(null); setResult(null); }}
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold">
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-700 text-white px-4 pt-10 pb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-brand-200 hover:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Upload Report</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-5">

        {/* File picker */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Report file *</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-brand-400 transition bg-white">
            {preview ? (
              <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-xl object-contain" />
            ) : file ? (
              <div>
                <p className="text-brand-600 font-semibold">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">PDF ready to process</p>
              </div>
            ) : (
              <div>
                <p className="text-4xl mb-2">📄</p>
                <p className="text-gray-500 text-sm">Tap to select PDF or image</p>
                <p className="text-gray-400 text-xs mt-1">Lab reports, prescriptions, scans</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileChange}
            className="hidden"
            capture="environment"
          />
          {file && (
            <button type="button" onClick={() => { setFile(null); setPreview(null); }}
              className="text-xs text-gray-400 mt-1 underline">Remove</button>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
          <select value={category} onChange={e => setCategory(e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white">
            <option value="">Select report type</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Report date <span className="font-normal text-gray-400">(optional)</span></label>
          <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full py-4 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-semibold text-base disabled:opacity-60 transition">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Extracting values…
            </span>
          ) : 'Upload & Extract'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Values are automatically extracted from PDF text.<br />Image OCR may take a few seconds.
        </p>
      </form>
    </div>
  );
}
