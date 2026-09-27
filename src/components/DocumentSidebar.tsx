'use client';

import { useState, useMemo } from 'react';

type DocRecord = {
  id: string;
  category: string;
  file_url: string | null;
  file_type: string | null;
  report_date: string | null;
  created_at: string;
  member: { id: string; name: string; relation: string } | null;
};

type Props = {
  records: DocRecord[];
  members: { id: string; name: string }[];
  open: boolean;
  onClose: () => void;
};

const CATEGORIES = [
  'Complete Blood Count (CBC)',
  'Blood Sugar / Diabetes',
  'Liver Function Test (LFT)',
  'Renal Function Test (RFT)',
  'Blood Group',
  'Viral Markers',
  'Cholesterol / Lipid Profile',
  'Thyroid (TSH/T3/T4)',
  'Vitamin Profile',
  'X-Ray / Scan Report',
  'Prescription',
  'Other',
];

function PdfIcon() {
  return (
    <div className="w-9 h-10 flex-shrink-0 bg-red-50 rounded-lg flex flex-col items-center justify-center border border-red-100">
      <span className="text-red-500 text-xs font-bold leading-none">PDF</span>
    </div>
  );
}

function ImgIcon() {
  return (
    <div className="w-9 h-10 flex-shrink-0 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

function DocItem({ record }: { record: DocRecord }) {
  const dateStr = record.report_date
    ? new Date(record.report_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
    : new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });

  if (!record.file_url) return null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition group">
      {record.file_type === 'pdf' ? <PdfIcon /> : <ImgIcon />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{record.category}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {record.member?.name ?? 'Unknown'} · {dateStr}
        </p>
        <a
          href={record.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-brand-600 hover:text-brand-800 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View / Download
        </a>
      </div>
    </div>
  );
}

function SidebarContent({ records, members }: { records: DocRecord[]; members: { id: string; name: string }[] }) {
  const [memberId, setMemberId] = useState('');
  const [category, setCategory] = useState('');

  const filtered = useMemo(() =>
    records.filter(r => {
      if (!r.file_url) return false;
      if (memberId && r.member?.id !== memberId) return false;
      if (category && r.category !== category) return false;
      return true;
    }),
    [records, memberId, category]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <p className="font-bold text-gray-800 text-sm mb-3">Documents</p>
        <div className="space-y-2">
          <select value={memberId} onChange={e => setMemberId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white">
            <option value="">All members</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white">
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-400 mt-2">{filtered.length} file{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs">No documents yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(r => <DocItem key={r.id} record={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export function DocumentSidebar({ records, members, open, onClose }: Props) {
  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0 bg-white border-l border-gray-100 sticky top-0 h-screen overflow-hidden">
        <SidebarContent records={records} members={members} />
      </aside>

      {/* Mobile drawer — slide in from right when open */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          {/* Drawer */}
          <div className="relative w-80 max-w-[90vw] bg-white h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100 flex-shrink-0">
              <p className="font-bold text-gray-800">Documents</p>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidebarContent records={records} members={members} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
