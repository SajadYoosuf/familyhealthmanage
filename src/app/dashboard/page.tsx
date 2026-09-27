'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RecordCard } from '@/components/RecordCard';
import { FilterBar } from '@/components/FilterBar';
import { MemberHealthCard, type MemberSummary } from '@/components/MemberHealthCard';

type Member = {
  id: string; name: string; relation: string;
  blood_group?: string | null; height_cm?: number | null; weight_kg?: number | null;
};

type DocRecord = {
  id: string; category: string; file_url: string | null; file_type: string | null;
  report_date: string | null; created_at: string;
  member: { id: string; name: string; relation: string } | null;
};

function getLatestValue(records: any[], testNames: string[]) {
  for (const rec of records) {
    const sd = rec.structured_data;
    const quant: any[] = Array.isArray(sd) ? sd : (sd?.quantitative || []);
    const match = quant.find(v => testNames.some(n => v.test?.toLowerCase().includes(n)));
    if (match) return { value: match.value, status: match.status };
  }
  return null;
}

// ─── Sidebar nav item ─────────────────────────────────────────────────────────

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}>
      {icon}
      {label}
    </button>
  );
}

// ─── File download ─────────────────────────────────────────────────────────────

async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank');
  }
}

// ─── Full-screen file viewer ──────────────────────────────────────────────────

function FileViewer({ record, onClose }: { record: DocRecord; onClose: () => void }) {
  const label = `${record.category} — ${record.member?.name ?? ''}`;
  const ext = record.file_type === 'pdf' ? 'pdf' : 'jpg';
  const filename = `${label}.${ext}`.replace(/[^a-z0-9.\-_ ]/gi, '_');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 flex-shrink-0 border-b border-white/10">
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{record.category}</p>
          <p className="text-gray-400 text-xs mt-0.5">{record.member?.name ?? '—'}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <button onClick={() => downloadFile(record.file_url!, filename)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        {record.file_type === 'pdf' ? (
          <iframe src={record.file_url!} className="w-full h-full rounded-xl" title={record.category} />
        ) : (
          <img src={record.file_url!} alt={record.category} className="max-w-full max-h-full object-contain rounded-xl" />
        )}
      </div>
    </div>
  );
}

// ─── Documents view ───────────────────────────────────────────────────────────

const DOC_CATEGORIES = [
  'Complete Blood Count (CBC)', 'Blood Sugar / Diabetes',
  'Liver Function Test (LFT)', 'Renal Function Test (RFT)',
  'Blood Group', 'Viral Markers', 'Cholesterol / Lipid Profile',
  'Thyroid (TSH/T3/T4)', 'Vitamin Profile', 'X-Ray / Scan Report',
  'Prescription', 'Other',
];

function DocDropdown({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const label = options.find(o => o.value === value)?.label || placeholder;
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button type="button" onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border transition whitespace-nowrap ${
          value ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
        }`}>
        <span className="max-w-[140px] truncate">{label}</span>
        <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl shadow-card-lg border border-gray-100 z-50 min-w-[200px] max-h-64 overflow-y-auto py-1.5">
          <button onClick={() => { onChange(''); setOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-gray-50 ${!value ? 'text-brand-600 font-semibold' : 'text-gray-500 font-medium'}`}>
            {!value && <svg className="w-3.5 h-3.5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>}
            {value && <span className="w-3.5"/>}
            {placeholder}
          </button>
          <div className="mx-3 border-t border-gray-100 mb-1"/>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-gray-50 ${value === opt.value ? 'text-brand-600 font-semibold bg-brand-50/50' : 'text-gray-700'}`}>
              {value === opt.value
                ? <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                : <span className="w-3.5"/>}
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentsView({ records, members }: { records: DocRecord[]; members: Member[] }) {
  const [memberId, setMemberId] = useState('');
  const [category, setCategory] = useState('');
  const [month, setMonth] = useState('');
  const [viewing, setViewing] = useState<DocRecord | null>(null);

  const filtered = useMemo(() =>
    records.filter(r => {
      if (!r.file_url) return false;
      if (memberId && r.member?.id !== memberId) return false;
      if (category && r.category !== category) return false;
      if (month) {
        const d = r.report_date ?? r.created_at;
        const ym = new Date(d).toISOString().slice(0, 7);
        if (ym !== month) return false;
      }
      return true;
    }),
    [records, memberId, category, month]
  );

  const fmt = (r: DocRecord) => {
    const d = r.report_date ?? r.created_at;
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  return (
    <>
      {viewing && <FileViewer record={viewing} onClose={() => setViewing(null)} />}
      <div className="px-4 lg:px-6 py-5 space-y-4 pb-24 lg:pb-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-shrink-0">
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className={`pl-9 pr-3 py-2 rounded-xl text-sm font-semibold border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 ${month ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`} />
            <svg className={`w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${month ? 'text-white' : 'text-gray-400'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <DocDropdown value={memberId} onChange={setMemberId}
            options={members.map(m => ({ value: m.id, label: m.name }))}
            placeholder="All members" />
          <DocDropdown value={category} onChange={setCategory}
            options={DOC_CATEGORIES.map(c => ({ value: c, label: c }))}
            placeholder="All categories" />
          {(month || memberId || category) && (
            <button onClick={() => { setMonth(''); setMemberId(''); setCategory(''); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 bg-red-50 rounded-xl px-3 py-2 hover:bg-red-100 transition">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400 font-medium">
            {filtered.length} file{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-semibold">No documents found</p>
            <p className="text-gray-400 text-xs mt-1">Upload a report to see it here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map(r => (
              <div key={r.id} onClick={() => setViewing(r)}
                className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100 cursor-pointer hover:shadow-card-md hover:border-brand-200 transition-all group">
                {r.file_type !== 'pdf' ? (
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img src={r.file_url!} alt={r.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-gradient-to-br from-red-50 to-orange-50 flex flex-col items-center justify-center border-b border-red-100/50">
                    <span className="text-3xl font-black text-red-200">PDF</span>
                  </div>
                )}
                <div className="p-2.5">
                  <p className="text-xs font-bold text-gray-800 truncate leading-tight">{r.category}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{r.member?.name ?? '—'} · {fmt(r)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [view, setView] = useState<'dashboard' | 'documents'>('dashboard');
  const [records, setRecords] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSummaries, setMemberSummaries] = useState<MemberSummary[]>([]);
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [myName, setMyName] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ month: '', member_id: '', category: '' });

  const loadFamilyInfo = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }

    const { data: member } = await supabase
      .from('family_members')
      .select('name, family_id, families(name, invite_code)')
      .eq('user_id', user.id)
      .single();

    if (!member) { router.push('/'); return; }

    setMyName(member.name);
    const fam = member.families as any;
    if (fam) { setFamilyName(fam.name); setInviteCode(fam.invite_code); }

    const { data: allMembers } = await supabase
      .from('family_members')
      .select('id, name, relation, blood_group, height_cm, weight_kg')
      .eq('family_id', member.family_id);

    setMembers(allMembers || []);

    const { data: summaryRecs } = await supabase
      .from('health_records')
      .select('member_id, structured_data, created_at')
      .eq('family_id', member.family_id)
      .order('created_at', { ascending: false })
      .limit(100);

    const summaries: MemberSummary[] = (allMembers || []).map(m => {
      const recs = (summaryRecs || []).filter(r => r.member_id === m.id);
      return {
        ...m,
        latest_sugar: getLatestValue(recs, ['random blood sugar', 'fasting blood sugar', 'blood sugar', 'glucose', 'post prandial']),
        latest_cholesterol: getLatestValue(recs, ['total cholesterol', 'cholesterol']),
      };
    });
    setMemberSummaries(summaries);
  }, [supabase, router]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.month) params.set('month', filters.month);
    if (filters.member_id) params.set('member_id', filters.member_id);
    if (filters.category) params.set('category', filters.category);
    const res = await fetch(`/api/records?${params}`);
    const data = await res.json();
    setRecords(data.records || []);
    setLoading(false);
  }, [filters]);

  useEffect(() => { loadFamilyInfo(); }, [loadFamilyInfo]);
  useEffect(() => { loadRecords(); }, [loadRecords]);

  function handleFilterChange(key: string, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const extractedCount = records.filter(r => {
    const sd = r.structured_data;
    return Array.isArray(sd) ? sd.length > 0 : (sd?.quantitative?.length > 0 || sd?.qualitative?.length > 0);
  }).length;

  // Nav icons
  const dashIcon = (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
  const docsIcon = (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">

      {/* ── Sidebar (desktop) ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 h-screen sticky top-0 flex-shrink-0 overflow-hidden">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{familyName || 'Family Health'}</p>
              <p className="text-xs text-gray-400 truncate">{myName}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavItem icon={dashIcon} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavItem icon={docsIcon} label="Documents" active={view === 'documents'} onClick={() => setView('documents')} />
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <button onClick={() => router.push('/add-member')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add Member
          </button>
          <button onClick={() => setShowInvite(!showInvite)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Invite Code
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-600 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>

        {showInvite && (
          <div className="mx-3 mb-3 bg-brand-50 rounded-xl p-3 border border-brand-100">
            <p className="text-brand-600 text-[10px] font-bold uppercase tracking-wider mb-1">Invite Code</p>
            <p className="font-mono font-bold tracking-widest text-brand-800 text-base">{inviteCode}</p>
            <button onClick={() => navigator.clipboard?.writeText(inviteCode)}
              className="text-brand-500 text-xs mt-1.5 font-semibold hover:text-brand-700">
              Copy to clipboard
            </button>
          </div>
        )}
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-100 px-4 pt-12 pb-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">{familyName || 'Family Health'}</p>
              <h1 className="text-lg font-bold text-gray-900">Hey, {myName || '—'}</h1>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => router.push('/add-member')}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition">
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </button>
              <button onClick={() => setShowInvite(!showInvite)}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition">
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
          {showInvite && (
            <div className="mt-3 bg-brand-50 border border-brand-100 rounded-2xl p-3">
              <p className="text-brand-500 text-[10px] font-bold uppercase tracking-wider mb-1">Invite Code</p>
              <p className="font-mono font-bold text-xl tracking-widest text-brand-800">{inviteCode}</p>
              <button onClick={() => navigator.clipboard?.writeText(inviteCode)}
                className="text-brand-500 text-xs mt-1.5 font-semibold">Copy</button>
            </div>
          )}
        </div>

        {/* Desktop page header */}
        <div className="hidden lg:flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {view === 'dashboard' ? 'Dashboard' : 'Documents'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {view === 'dashboard' ? `${records.length} reports · ${members.length} members` : 'All uploaded files'}
            </p>
          </div>
          {view === 'dashboard' && (
            <button onClick={() => router.push('/upload')}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Upload Report
            </button>
          )}
        </div>

        {/* ── Dashboard content ── */}
        {view === 'dashboard' && (
          <div className="px-4 lg:px-6 py-5 space-y-5 pb-24 lg:pb-8">

            {/* Member health cards */}
            {memberSummaries.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Family Members</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {memberSummaries.map(m => <MemberHealthCard key={m.id} member={m} />)}
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl shadow-card px-4 py-3.5 border border-gray-100">
                <p className="text-2xl font-black text-gray-900">{records.length}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Total Reports</p>
              </div>
              <div className="bg-white rounded-2xl shadow-card px-4 py-3.5 border border-gray-100">
                <p className="text-2xl font-black text-gray-900">{members.length}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Members</p>
              </div>
              <div className="bg-white rounded-2xl shadow-card px-4 py-3.5 border border-gray-100">
                <p className="text-2xl font-black text-emerald-500">{extractedCount}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Extracted</p>
              </div>
            </div>

            {/* Filters + records */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Records</h3>
              <FilterBar members={members} filters={filters} onChange={handleFilterChange} />
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-card">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-semibold text-sm">No reports yet</p>
                <p className="text-gray-400 text-xs mt-1">Upload your first medical report</p>
                <button onClick={() => router.push('/upload')}
                  className="mt-4 inline-flex items-center gap-2 bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-700 transition">
                  Upload Report
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map(r => <RecordCard key={r.id} record={r} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Documents content ── */}
        {view === 'documents' && (
          <DocumentsView records={records} members={members} />
        )}
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-200 flex items-end z-40 pb-safe">
        <button onClick={() => setView('dashboard')}
          className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-semibold transition-colors ${view === 'dashboard' ? 'text-brand-600' : 'text-gray-400'}`}>
          <svg className="w-5 h-5" fill={view === 'dashboard' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </button>

        {/* Upload FAB */}
        <button onClick={() => router.push('/upload')}
          className="flex flex-col items-center -mt-6 px-5 pb-1">
          <div className="w-14 h-14 rounded-full bg-brand-600 flex items-center justify-center shadow-lg ring-4 ring-white">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-[10px] font-bold text-brand-600 mt-1">Upload</span>
        </button>

        <button onClick={() => setView('documents')}
          className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-semibold transition-colors ${view === 'documents' ? 'text-brand-600' : 'text-gray-400'}`}>
          <svg className="w-5 h-5" fill={view === 'documents' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Docs
        </button>
      </div>

    </div>
  );
}
