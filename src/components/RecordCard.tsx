'use client';

import { useState } from 'react';
import type { MedicalValue, QualitativeValue } from '@/lib/extract';

type StructuredData = {
  quantitative?: MedicalValue[];
  qualitative?: QualitativeValue[];
} | MedicalValue[];

type Record = {
  id: string;
  category: string;
  report_date: string | null;
  structured_data: StructuredData;
  file_url: string | null;
  file_type: string | null;
  raw_text?: string | null;
  member: { id: string; name: string; relation: string } | null;
  uploaded_by: { name: string } | null;
  created_at: string;
};

const STATUS_STYLES: Record<string, { text: string; bg: string; icon: string }> = {
  normal:  { text: 'text-emerald-700', bg: 'bg-emerald-50',  icon: '↑' },
  high:    { text: 'text-red-600',     bg: 'bg-red-50',      icon: '↑' },
  low:     { text: 'text-amber-600',   bg: 'bg-amber-50',    icon: '↓' },
  unknown: { text: 'text-gray-500',    bg: 'bg-gray-50',     icon: '–' },
};

const STATUS_DOT: Record<string, string> = {
  normal: 'bg-emerald-400',
  high:   'bg-red-400',
  low:    'bg-amber-400',
  unknown:'bg-gray-300',
};

const RELATION_COLORS: Record<string, { text: string; bg: string }> = {
  father:   { text: 'text-blue-700',   bg: 'bg-blue-50'   },
  mother:   { text: 'text-rose-700',   bg: 'bg-rose-50'   },
  son:      { text: 'text-indigo-700', bg: 'bg-indigo-50' },
  daughter: { text: 'text-purple-700', bg: 'bg-purple-50' },
  other:    { text: 'text-gray-600',   bg: 'bg-gray-100'  },
};

const CATEGORY_ICONS: Record<string, string> = {
  'Blood Sugar / Diabetes': '🩸',
  'Complete Blood Count (CBC)': '💉',
  'Cholesterol / Lipid Profile': '🫀',
  'Liver Function Test (LFT)': '🫁',
  'Renal Function Test (RFT)': '🫘',
  'Thyroid (TSH/T3/T4)': '🦋',
  'Blood Pressure': '📊',
  'Vitamin Profile': '💊',
  'X-Ray / Scan Report': '🔬',
  'Prescription': '📋',
  'Viral Markers': '🦠',
  'Blood Group': '🩸',
};

export function RecordCard({ record }: { record: Record }) {
  const [expanded, setExpanded] = useState(false);

  const dateStr = record.report_date
    ? new Date(record.report_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const sd = record.structured_data;
  const quantitative: MedicalValue[] = Array.isArray(sd) ? sd : (sd?.quantitative || []);
  const qualitative: QualitativeValue[] = Array.isArray(sd) ? [] : (sd?.qualitative || []);
  const hasValues = quantitative.length > 0 || qualitative.length > 0;
  const rel = RELATION_COLORS[record.member?.relation || 'other'] || RELATION_COLORS.other;
  const catIcon = CATEGORY_ICONS[record.category] || '📄';

  const overallStatus = hasValues
    ? quantitative.some(v => v.status === 'high') ? 'high'
    : quantitative.some(v => v.status === 'low') ? 'low'
    : quantitative.length > 0 ? 'normal' : 'unknown'
    : 'unknown';

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden hover:shadow-card-md transition-shadow">
      {/* Top accent bar */}
      <div className={`h-0.5 ${STATUS_DOT[overallStatus]}`} />

      {/* Header */}
      <div className="px-4 py-3.5 flex items-start gap-3">
        {/* Category icon */}
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 text-lg">
          {catIcon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight">{record.category}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {record.member && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rel.bg} ${rel.text}`}>
                {record.member.name}
              </span>
            )}
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {dateStr}
            </span>
          </div>
        </div>

        {/* Status badge */}
        {hasValues && (
          <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${STATUS_STYLES[overallStatus].bg} ${STATUS_STYLES[overallStatus].text}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[overallStatus]}`} />
            {overallStatus === 'normal' ? 'Normal' : overallStatus === 'high' ? 'Attention' : overallStatus === 'low' ? 'Low' : '—'}
          </div>
        )}
      </div>

      {/* Values */}
      {hasValues ? (
        <div className="px-4 pb-4 space-y-3">
          {quantitative.length > 0 && (
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {quantitative.map((v, i) => {
                    const s = STATUS_STYLES[v.status] || STATUS_STYLES.unknown;
                    return (
                      <tr key={i} className={i > 0 ? 'border-t border-gray-100' : ''}>
                        <td className="py-2.5 px-3 text-xs text-gray-600 font-medium">{v.test}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-sm font-bold text-gray-900">{v.value}</span>
                          <span className="text-xs text-gray-400 ml-1">{v.unit}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${s.bg} ${s.text}`}>
                            {v.status === 'normal' ? 'Normal' : v.status === 'high' ? '↑ High' : v.status === 'low' ? '↓ Low' : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {qualitative.length > 0 && (
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              {qualitative.map((v, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                  <span className="text-xs text-gray-600 font-medium">{v.test}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                    v.status === 'abnormal' ? 'bg-red-50 text-red-600' :
                    v.status === 'info' ? 'bg-blue-50 text-blue-700' :
                    'bg-emerald-50 text-emerald-700'
                  }`}>
                    {v.result}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-xl px-3 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">No values extracted</span>
            <button onClick={() => setExpanded(!expanded)}
              className="text-xs text-brand-600 font-semibold hover:text-brand-700 transition">
              {expanded ? 'Hide text' : 'View raw text'}
            </button>
          </div>
          {expanded && record.raw_text && (
            <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-xl p-3 max-h-48 overflow-y-auto border border-gray-100">
              {record.raw_text}
            </pre>
          )}
          {expanded && !record.raw_text && (
            <p className="mt-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">No text was extracted from this file.</p>
          )}
        </div>
      )}
    </div>
  );
}
