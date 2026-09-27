'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

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

type DropdownOption = { value: string; label: string };

function Dropdown({ value, onChange, options, placeholder, active }: {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  placeholder: string;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const openDropdown = useCallback(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 220) });
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className="flex-shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => open ? setOpen(false) : openDropdown()}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border transition whitespace-nowrap ${
          active
            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800'
        }`}
      >
        <span className="max-w-[140px] truncate">{selectedLabel}</span>
        <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.width, zIndex: 9999 }}
          className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 max-h-64 overflow-y-auto py-1.5"
        >
          <button
            onClick={() => { onChange(''); setOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition hover:bg-gray-50 ${!value ? 'text-brand-600 font-semibold' : 'text-gray-500 font-medium'}`}
          >
            {!value
              ? <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              : <span className="w-3.5 flex-shrink-0"/>}
            {placeholder}
          </button>
          <div className="mx-3 border-t border-gray-100 mb-1" />
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition hover:bg-gray-50 ${
                value === opt.value ? 'text-brand-600 font-semibold bg-brand-50/50' : 'text-gray-700'
              }`}
            >
              {value === opt.value
                ? <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                : <span className="w-3.5 flex-shrink-0"/>}
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export function FilterBar({ members, filters, onChange }: Props) {
  const hasFilters = filters.month || filters.member_id || filters.category;
  const memberOptions: DropdownOption[] = members.map(m => ({ value: m.id, label: m.name }));
  const categoryOptions: DropdownOption[] = CATEGORIES.map(c => ({ value: c, label: c }));

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar items-center">
      {/* Month picker */}
      <div className="relative flex-shrink-0">
        <input
          type="month"
          value={filters.month}
          onChange={e => onChange('month', e.target.value)}
          className={`pl-9 pr-3 py-2 rounded-xl text-sm font-semibold border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            filters.month
              ? 'bg-brand-600 text-white border-brand-600 shadow-sm [color-scheme:dark]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        />
        <svg
          className={`w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${filters.month ? 'text-white' : 'text-gray-400'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <Dropdown
        value={filters.member_id}
        onChange={v => onChange('member_id', v)}
        options={memberOptions}
        placeholder="All members"
        active={!!filters.member_id}
      />

      <Dropdown
        value={filters.category}
        onChange={v => onChange('category', v)}
        options={categoryOptions}
        placeholder="All categories"
        active={!!filters.category}
      />

      {hasFilters && (
        <button
          onClick={() => { onChange('month', ''); onChange('member_id', ''); onChange('category', ''); }}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 bg-red-50 rounded-xl px-3 py-2 hover:bg-red-100 transition whitespace-nowrap"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
}
