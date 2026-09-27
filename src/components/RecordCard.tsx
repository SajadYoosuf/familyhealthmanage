'use client';

import { useState } from 'react';
import type { MedicalValue, QualitativeValue } from '@/lib/extract';

type StructuredData = {
  quantitative?: MedicalValue[];
  qualitative?: QualitativeValue[];
} | MedicalValue[]; // backwards compat

type Record = {
  id: string;
  category: string;
  report_date: string | null;
  structured_data: StructuredData;
  file_url: string | null;
  file_type: string | null;
  member: { id: string; name: string; relation: string } | null;
  uploaded_by: { name: string } | null;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  normal: 'text-green-600 bg-green-50',
  high: 'text-red-600 bg-red-50',
  low: 'text-amber-600 bg-amber-50',
  unknown: 'text-gray-500 bg-gray-50',
};

const STATUS_ICONS: Record<string, string> = {
  normal: '✓',
  high: '↑',
  low: '↓',
  unknown: '?',
};

const RELATION_COLORS: Record<string, string> = {
  father: 'bg-blue-100 text-blue-700',
  mother: 'bg-pink-100 text-pink-700',
  son: 'bg-indigo-100 text-indigo-700',
  daughter: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700',
};

export function RecordCard({ record }: { record: Record }) {
  const [expanded, setExpanded] = useState(false);

  const dateStr = record.report_date
    ? new Date(record.report_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Handle both old array format and new {quantitative, qualitative} format
  const sd = record.structured_data;
  const quantitative: MedicalValue[] = Array.isArray(sd) ? sd : (sd?.quantitative || []);
  const qualitative: QualitativeValue[] = Array.isArray(sd) ? [] : (sd?.qualitative || []);
  const hasValues = quantitative.length > 0 || qualitative.length > 0;
  const memberRelation = record.member?.relation || 'other';

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {record.member && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RELATION_COLORS[memberRelation]}`}>
                  {record.member.name} · {record.member.relation}
                </span>
              )}
              <span className="text-xs text-gray-400">{dateStr}</span>
            </div>
            <p className="mt-1 font-semibold text-gray-800 text-sm truncate">{record.category}</p>
          </div>
          {record.file_url && (
            <a href={record.file_url} target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 text-brand-600 hover:text-brand-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Extracted Values */}
      {hasValues ? (
        <div className="p-4 space-y-3">
          {/* Quantitative (numeric) values */}
          {quantitative.length > 0 && (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {quantitative.map((v, i) => (
                  <tr key={i}>
                    <td className="py-1.5 text-gray-600 pr-2 text-xs">{v.test}</td>
                    <td className="py-1.5 font-semibold text-gray-900 text-right pr-2 whitespace-nowrap text-xs">
                      {v.value} <span className="text-gray-400 font-normal">{v.unit}</span>
                    </td>
                    <td className="py-1.5 text-right whitespace-nowrap">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[v.status]}`}>
                        {STATUS_ICONS[v.status]} {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Qualitative (text result) values — Blood Group, Viral Markers */}
          {qualitative.length > 0 && (
            <div className="space-y-1.5">
              {qualitative.map((v, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{v.test}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    v.status === 'abnormal' ? 'bg-red-50 text-red-600' :
                    v.status === 'info' ? 'bg-blue-50 text-blue-700' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {v.result}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-sm text-gray-500">
          No values auto-extracted.{' '}
          <button onClick={() => setExpanded(!expanded)} className="text-brand-600 underline">
            {expanded ? 'Hide text' : 'View raw text'}
          </button>
          {expanded && record.raw_text && (
            <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-xl p-3 max-h-48 overflow-y-auto">
              {record.raw_text}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
