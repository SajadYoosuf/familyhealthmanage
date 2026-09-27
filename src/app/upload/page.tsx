'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function UploadPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ extracted: number; rawTextLength: number } | null>(null);

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
    if (!file) { setError('Please select a file'); return; }
    setError('');
    setLoading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed');
        setLoading(false);
        return;
      }
      setResult({ extracted: data.extracted_count, rawTextLength: data.raw_text_length ?? 0 });
    } catch {
      setError('Upload failed. Please try again.');
    }
    setLoading(false);
  }

  if (result) {
    const success = result.extracted > 0;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-card-lg p-8 max-w-sm w-full text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${success ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            {success ? (
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {success ? 'Report Uploaded!' : 'Uploaded Successfully'}
          </h2>
          {success ? (
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-sm font-semibold mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {result.extracted} values extracted
            </div>
          ) : null}
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            {result.extracted > 0
              ? 'Medical values have been automatically detected and saved to the dashboard.'
              : result.rawTextLength === 0
                ? 'This looks like a scanned PDF. Try uploading a photo (JPG) instead for better OCR results.'
                : 'Text was read but specific values could not be matched. You can view the raw text on the dashboard.'}
          </p>
          <div className="space-y-3">
            <button onClick={() => router.push('/dashboard')}
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition">
              View Dashboard
            </button>
            <button onClick={() => { setFile(null); setPreview(null); setResult(null); }}
              className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 transition">
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
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition text-gray-600 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Upload Report</h1>
          <p className="text-xs text-gray-400">Lab reports, prescriptions, scans</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 max-w-lg mx-auto space-y-5">

        {/* Drop zone */}
        <div>
          <div
            onClick={() => fileRef.current?.click()}
            className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all border-2 border-dashed ${
              file ? 'border-brand-400 bg-brand-50' : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50'
            }`}>
            {preview ? (
              <div className="relative">
                <img src={preview} alt="preview" className="w-full max-h-72 object-contain" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-white text-xs font-semibold bg-black/40 backdrop-blur px-2.5 py-1 rounded-lg">
                    {file.name}
                  </span>
                  <span className="text-white text-xs bg-brand-600/80 backdrop-blur px-2.5 py-1 rounded-lg font-semibold">
                    Ready
                  </span>
                </div>
              </div>
            ) : file ? (
              <div className="py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-red-500 font-black text-lg">PDF</span>
                </div>
                <p className="text-gray-700 font-semibold text-sm">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">PDF ready to process</p>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-semibold text-sm">Tap to select or take photo</p>
                <p className="text-gray-400 text-xs mt-1.5">JPG, PNG or PDF • Lab reports &amp; prescriptions</p>
              </div>
            )}
          </div>
          {file && (
            <button type="button" onClick={() => { setFile(null); setPreview(null); }}
              className="text-xs text-gray-400 hover:text-gray-600 mt-2 ml-1 underline transition">
              Remove file
            </button>
          )}
          <input ref={fileRef} type="file" accept="application/pdf,image/*"
            onChange={handleFileChange} className="hidden" capture="environment" />
        </div>

        {/* Info */}
        <div className="bg-brand-50 rounded-2xl p-4 flex gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="text-brand-700 text-sm font-semibold">Auto-extraction</p>
            <p className="text-brand-600/70 text-xs mt-0.5 leading-relaxed">
              Category, date and medical values are automatically detected. Works best with clear photos of lab reports.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || !file}
          className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base disabled:opacity-50 transition shadow-sm">
          {loading ? (
            <span className="flex items-center justify-center gap-2.5">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Reading report…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload &amp; Extract
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
