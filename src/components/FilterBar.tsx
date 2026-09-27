'use client';

const CATEGORIES = [
  'Complete Blood Count (CBC)',
  'Blood Sugar / Diabetes',
  'Liver Function Test (LFT)',
  'Renal Function Test (RFT)',
  'Blood Group',
  'Viral Markers',
  'Cholesterol / Lipid Profile',
  'Blood Pressure',
  'Thyroid (TSH/T3/T4)',
  'Vitamin Profile',
  'Prescription',
  'X-Ray / Scan Report',
  'Other',
];

type Member = { id: string; name: string; relation: string };

type Props = {
  members: Member[];
  filters: { month: string; member_id: string; category: string };
  onChange: (key: string, value: string) => void;
};

const selectClass = "flex-shrink-0 bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition appearance-none cursor-pointer hover:border-gray-300";

export function FilterBar({ members, filters, onChange }: Props) {
  const hasFilters = filters.month || filters.member_id || filters.category;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar items-center">
      <div className="flex items-center gap-1.5 flex-shrink-0 text-gray-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </div>

      <input
        type="month"
        value={filters.month}
        onChange={e => onChange('month', e.target.value)}
        className={`${selectClass} ${filters.month ? 'border-brand-400 bg-brand-50 text-brand-700' : ''}`}
      />

      <select
        value={filters.member_id}
        onChange={e => onChange('member_id', e.target.value)}
        className={`${selectClass} ${filters.member_id ? 'border-brand-400 bg-brand-50 text-brand-700' : ''}`}
      >
        <option value="">All members</option>
        {members.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

      <select
        value={filters.category}
        onChange={e => onChange('category', e.target.value)}
        className={`${selectClass} ${filters.category ? 'border-brand-400 bg-brand-50 text-brand-700' : ''}`}
      >
        <option value="">All categories</option>
        {CATEGORIES.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => { onChange('month', ''); onChange('member_id', ''); onChange('category', ''); }}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-500 px-3 py-2 rounded-xl border border-gray-200 bg-white whitespace-nowrap transition hover:border-red-200 hover:bg-red-50">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
}
