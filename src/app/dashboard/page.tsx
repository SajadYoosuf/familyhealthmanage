'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RecordCard } from '@/components/RecordCard';
import { FilterBar } from '@/components/FilterBar';
import { MemberHealthCard, type MemberSummary } from '@/components/MemberHealthCard';
import { DocumentSidebar } from '@/components/DocumentSidebar';

type Member = {
  id: string;
  name: string;
  relation: string;
  blood_group?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
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

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [records, setRecords] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSummaries, setMemberSummaries] = useState<MemberSummary[]>([]);
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [myName, setMyName] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ month: '', member_id: '', category: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    if (fam) {
      setFamilyName(fam.name);
      setInviteCode(fam.invite_code);
    }

    const { data: allMembers } = await supabase
      .from('family_members')
      .select('id, name, relation, blood_group, height_cm, weight_kg')
      .eq('family_id', member.family_id);

    setMembers(allMembers || []);

    // Fetch recent records to compute latest sugar/cholesterol per member
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-700 text-white px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-brand-200 text-sm">Welcome back, {myName}</p>
            <h1 className="text-xl font-bold">{familyName || 'Family Health'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Documents toggle — mobile only */}
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-brand-200 hover:text-white p-1" title="Documents">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button onClick={() => router.push('/add-member')}
              className="text-brand-200 hover:text-white p-1" title="Add family member">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>
            <button onClick={() => setShowInvite(!showInvite)}
              className="text-brand-200 hover:text-white p-1" title="Invite code">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button onClick={handleLogout} className="text-brand-200 hover:text-white p-1" title="Logout">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {showInvite && (
          <div className="mt-3 bg-brand-800 rounded-xl p-3 text-sm">
            <p className="text-brand-200 mb-1">Share this invite code with family:</p>
            <p className="font-mono text-lg font-bold tracking-widest text-white">{inviteCode}</p>
            <button onClick={() => navigator.clipboard?.writeText(inviteCode)}
              className="text-brand-300 text-xs mt-1 underline">Copy code</button>
          </div>
        )}
      </div>

      <div className="flex min-h-0">
      <div className="flex-1 min-w-0 px-4 py-4 space-y-4">

        {/* Member Health Cards */}
        {memberSummaries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {memberSummaries.map(m => <MemberHealthCard key={m.id} member={m} />)}
          </div>
        )}

        {/* Filters */}
        <FilterBar members={members} filters={filters} onChange={handleFilterChange} />

        {/* Stats */}
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
              {records.filter(r => r.structured_data?.length > 0).length}
            </p>
            <p className="text-xs text-gray-500">Extracted</p>
          </div>
        </div>

        {/* Records */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🏥</div>
            <p className="text-gray-500 text-sm">No records yet.<br />Upload your first medical report below.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map(r => <RecordCard key={r.id} record={r} />)}
          </div>
        )}
      </div>

      </div>{/* end main column */}

      <DocumentSidebar
        records={records}
        members={members}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      </div>{/* end flex row */}

      {/* Upload FAB */}
      <div className="fixed bottom-6 right-4 lg:right-[calc(18rem+1rem)]">
        <button onClick={() => router.push('/upload')}
          className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-lg transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload Report
        </button>
      </div>
    </div>
  );
}
