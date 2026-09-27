'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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

// ─── Nav item ────────────────────────────────────────────────────────────────

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
        active ? 'bg-brand-700 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}>
      {icon}
      {label}
    </button>
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

function FileViewer({ record, onClose }: { record: DocRecord; onClose: () => void }) {
  const label = `${record.category} — ${record.member?.name ?? ''}`;
  const ext = record.file_type === 'pdf' ? 'pdf' : 'jpg';
  const filename = `${label}.${ext}`.replace(/[^a-z0-9.\-_ ]/gi, '_');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 flex-shrink-0">
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{record.category}</p>
          <p className="text-gray-400 text-xs">{record.member?.name ?? '—'}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <button
            onClick={() => downloadFile(record.file_url!, filename)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        {record.file_type === 'pdf' ? (
          <iframe
            src={record.file_url!}
            className="w-full h-full"
            title={record.category}
          />
        ) : (
          <img
            src={record.file_url!}
            alt={record.category}
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>
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

      <div className="px-4 lg:px-6 py-4 space-y-4 pb-24 lg:pb-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white" />
          <select value={memberId} onChange={e => setMemberId(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white">
            <option value="">All members</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white">
            <option value="">All categories</option>
            {DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {(month || memberId || category) && (
            <button onClick={() => { setMonth(''); setMemberId(''); setCategory(''); }}
              className="text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-2 bg-white hover:border-gray-300">
              Clear
            </button>
          )}
          <span className="self-center text-xs text-gray-400 ml-auto">
            {filtered.length} file{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📂</div>
            <p className="text-gray-400 text-sm">No documents found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map(r => (
              <div key={r.id}
                onClick={() => setViewing(r)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-brand-200 transition group">
                {/* Preview */}
                {r.file_type !== 'pdf' ? (
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img src={r.file_url!} alt={r.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-red-50 flex flex-col items-center justify-center border-b border-red-100">
                    <span className="text-4xl font-black text-red-200 leading-none">PDF</span>
                    <span className="text-xs text-red-400 mt-1 px-2 text-center truncate w-full px-3">{r.category}</span>
                  </div>
                )}
                {/* Meta */}
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{r.category}</p>
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

// ─── Main dashboard page ──────────────────────────────────────────────────────

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

  const dashIcon = (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
  const docsIcon = (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">

      {/* ── Left sidebar (desktop) ── */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 min-h-screen sticky top-0 flex-shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Family Health</p>
          <p className="font-bold text-gray-800 truncate">{familyName || '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{myName}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem icon={dashIcon} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavItem icon={docsIcon} label="Documents" active={view === 'documents'} onClick={() => setView('documents')} />
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <button onClick={() => router.push('/add-member')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add Member
          </button>
          <button onClick={() => setShowInvite(!showInvite)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Invite Code
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        {showInvite && (
          <div className="mx-3 mb-3 bg-brand-50 rounded-xl p-3 text-sm border border-brand-100">
            <p className="text-brand-600 text-xs mb-1">Invite code</p>
            <p className="font-mono font-bold tracking-widest text-brand-800">{inviteCode}</p>
            <button onClick={() => navigator.clipboard?.writeText(inviteCode)}
              className="text-brand-500 text-xs mt-1 underline">Copy</button>
          </div>
        )}
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Mobile header */}
        <div className="lg:hidden bg-brand-700 text-white px-4 pt-10 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-200 text-xs">Welcome, {myName}</p>
              <h1 className="text-lg font-bold">{familyName || 'Family Health'}</h1>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => router.push('/add-member')} className="text-brand-200 hover:text-white p-1.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </button>
              <button onClick={() => setShowInvite(!showInvite)} className="text-brand-200 hover:text-white p-1.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
          {showInvite && (
            <div className="mt-3 bg-brand-800 rounded-xl p-3">
              <p className="text-brand-200 text-xs mb-1">Invite code</p>
              <p className="font-mono text-lg font-bold tracking-widest text-white">{inviteCode}</p>
              <button onClick={() => navigator.clipboard?.writeText(inviteCode)}
                className="text-brand-300 text-xs mt-1 underline">Copy</button>
            </div>
          )}
        </div>

        {/* Desktop page title bar */}
        <div className="hidden lg:flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {view === 'dashboard' ? 'Dashboard' : 'Documents'}
          </h2>
          {view === 'dashboard' && (
            <button onClick={() => router.push('/upload')}
              className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold px-4 py-2 rounded-xl text-sm transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Report
            </button>
          )}
        </div>

        {/* ── Dashboard view ── */}
        {view === 'dashboard' && (
          <div className="px-4 lg:px-6 py-4 space-y-4 pb-24 lg:pb-6">
            {memberSummaries.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {memberSummaries.map(m => <MemberHealthCard key={m.id} member={m} />)}
              </div>
            )}
            <FilterBar members={members} filters={filters} onChange={handleFilterChange} />
            <div className="flex gap-3">
              <div className="bg-white rounded-xl p-3 flex-1 text-center shadow-sm">
                <p className="text-2xl font-bold text-brand-700">{records.length}</p>
                <p className="text-xs text-gray-500">Reports</p>
              </div>
              <div className="bg-white rounded-xl p-3 flex-1 text-center shadow-sm">
                <p className="text-2xl font-bold text-brand-700">{members.length}</p>
                <p className="text-xs text-gray-500">Members</p>
              </div>
              <div className="bg-white rounded-xl p-3 flex-1 text-center shadow-sm">
                <p className="text-2xl font-bold text-green-600">
                  {records.filter(r => {
                    const sd = r.structured_data;
                    return Array.isArray(sd) ? sd.length > 0 : (sd?.quantitative?.length > 0 || sd?.qualitative?.length > 0);
                  }).length}
                </p>
                <p className="text-xs text-gray-500">Extracted</p>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading…</div>
            ) : records.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🏥</div>
                <p className="text-gray-500 text-sm">No records yet.<br />Upload your first medical report.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map(r => <RecordCard key={r.id} record={r} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Documents view ── */}
        {view === 'documents' && (
          <DocumentsView records={records} members={members} />
        )}
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center z-40">
        <button onClick={() => setView('dashboard')}
          className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-semibold transition-colors ${view === 'dashboard' ? 'text-brand-700' : 'text-gray-400'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Dashboard
        </button>

        {/* Upload FAB — center tab */}
        <button onClick={() => router.push('/upload')}
          className="flex flex-col items-center -mt-5 px-5">
          <div className="w-14 h-14 rounded-full bg-brand-700 flex items-center justify-center shadow-lg border-4 border-white">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-brand-700 mt-1">Upload</span>
        </button>

        <button onClick={() => setView('documents')}
          className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-semibold transition-colors ${view === 'documents' ? 'text-brand-700' : 'text-gray-400'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Documents
        </button>
      </div>

    </div>
  );
}
