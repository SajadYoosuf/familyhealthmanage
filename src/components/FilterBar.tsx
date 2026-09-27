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

export function FilterBar({ members, filters, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
      {/* Month */}
      <input
        type="month"
        value={filters.month}
        onChange={e => onChange('month', e.target.value)}
        className="flex-shrink-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
      />

      {/* Member */}
      <select
        value={filters.member_id}
        onChange={e => onChange('member_id', e.target.value)}
        className="flex-shrink-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
      >
        <option value="">All members</option>
        {members.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

      {/* Category */}
      <select
        value={filters.category}
        onChange={e => onChange('category', e.target.value)}
        className="flex-shrink-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
      >
        <option value="">All categories</option>
        {CATEGORIES.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Clear */}
      {(filters.month || filters.member_id || filters.category) && (
        <button
          onClick={() => { onChange('month', ''); onChange('member_id', ''); onChange('category', ''); }}
          className="flex-shrink-0 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl border border-gray-200 bg-white whitespace-nowrap"
        >
          Clear
        </button>
      )}
    </div>
  );
}
