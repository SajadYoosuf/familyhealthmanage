'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RecordCard } from '@/components/RecordCard';
import { FilterBar } from '@/components/FilterBar';

type Member = { id: string; name: string; relation: string };

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [records, setRecords] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
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
    if (fam) {
      setFamilyName(fam.name);
      setInviteCode(fam.invite_code);
    }

    const { data: allMembers } = await supabase
      .from('family_members')
      .select('id, name, relation')
      .eq('family_id', member.family_id);

    setMembers(allMembers || []);
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

      <div className="px-4 py-4 space-y-4">
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

      {/* Upload FAB */}
      <div className="fixed bottom-6 right-4">
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
