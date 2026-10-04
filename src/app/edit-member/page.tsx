'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const RELATIONS = [
  { value: 'father',   label: 'Father'   },
  { value: 'mother',   label: 'Mother'   },
  { value: 'son',      label: 'Son'      },
  { value: 'daughter', label: 'Daughter' },
  { value: 'other',    label: 'Other'    },
];

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

function EditMemberForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const memberId = params.get('id');

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!memberId) { router.push('/dashboard'); return; }

    supabase
      .from('family_members')
      .select('name, relation, blood_group, height_cm, weight_kg')
      .eq('id', memberId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { router.push('/dashboard'); return; }
        setName(data.name || '');
        setRelation(data.relation || '');
        setBloodGroup(data.blood_group || '');
        setHeightCm(data.height_cm?.toString() || '');
        setWeightKg(data.weight_kg?.toString() || '');
        setFetching(false);
      });
  }, [memberId, supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !relation) { setError('Name and relation are required'); return; }
    setError('');
    setLoading(true);

    const res = await fetch('/api/family/update-member', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: memberId,
        name,
        relation,
        blood_group: bloodGroup || null,
        height_cm: heightCm || null,
        weight_kg: weightKg || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Update failed');
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-card-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Updated</h2>
          <p className="text-gray-500 text-sm mb-6">Changes saved successfully.</p>
          <button onClick={() => router.push('/dashboard')}
            className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition text-gray-600 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Edit Member</h1>
          <p className="text-xs text-gray-400">Update health info &amp; profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 max-w-lg mx-auto space-y-5">

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white" />
        </div>

        {/* Relation */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Relation *</label>
          <div className="grid grid-cols-3 gap-2">
            {RELATIONS.map(r => (
              <button key={r.value} type="button" onClick={() => setRelation(r.value)}
                className={`py-2.5 rounded-xl text-sm font-medium border-2 transition ${
                  relation === r.value
                    ? 'border-brand-700 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600 bg-white hover:border-brand-300'
                }`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Blood Group */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Blood Group <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_GROUPS.map(bg => (
              <button key={bg} type="button" onClick={() => setBloodGroup(bloodGroup === bg ? '' : bg)}
                className={`py-2 rounded-xl text-sm font-semibold border-2 transition ${
                  bloodGroup === bg
                    ? 'border-brand-700 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600 bg-white hover:border-brand-300'
                }`}>
                {bg}
              </button>
            ))}
          </div>
        </div>

        {/* Height + Weight */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Height <span className="font-normal text-gray-400">(cm)</span>
            </label>
            <input type="number" placeholder="e.g. 165" value={heightCm}
              onChange={e => setHeightCm(e.target.value)} min="50" max="250"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Weight <span className="font-normal text-gray-400">(kg)</span>
            </label>
            <input type="number" placeholder="e.g. 68" value={weightKg}
              onChange={e => setWeightKg(e.target.value)} min="10" max="300"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white" />
          </div>
        </div>

        {/* BMI preview */}
        {heightCm && weightKg && (
          <div className="bg-brand-50 rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-brand-700 text-sm font-semibold">BMI Preview</span>
            <span className="text-brand-800 font-black text-lg">
              {(parseFloat(weightKg) / ((parseFloat(heightCm) / 100) ** 2)).toFixed(1)}
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base disabled:opacity-50 transition">
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

export default function EditMemberPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    }>
      <EditMemberForm />
    </Suspense>
  );
}
