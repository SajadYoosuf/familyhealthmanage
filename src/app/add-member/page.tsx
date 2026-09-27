'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const RELATIONS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'other', label: 'Other' },
];

const PASSWORD_WORDS = ['Health', 'Family', 'Care', 'Heart', 'Happy', 'Safe', 'Smile', 'Love'];

function generatePassword() {
  const word = PASSWORD_WORDS[Math.floor(Math.random() * PASSWORD_WORDS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}${num}`;
}

export default function AddMemberPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [bloodGroup, setBloodGroup] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    setAppUrl(window.location.origin);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/');
    });
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !name || !relation) {
      setError('Please fill all fields');
      return;
    }
    setError('');
    setLoading(true);

    const res = await fetch('/api/family/add-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, name, relation, password,
        blood_group: bloodGroup || null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Something went wrong');
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  function shareViaWhatsApp() {
    const message = `Hi ${name}! 👋\n\nHere are your Family Health app login details:\n\n📧 Email: ${email}\n🔑 Password: ${password}\n🔗 App: ${appUrl}\n\nOpen the app and login with these details to view family health records.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  function copyCredentials() {
    const text = `Email: ${email}\nPassword: ${password}\nApp: ${appUrl}`;
    navigator.clipboard?.writeText(text);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-gray-800">Account Created!</h2>
            <p className="text-sm text-gray-500 mt-1">Share the login details with {name}</p>
          </div>

          {/* Credentials card */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Email</span>
              <span className="text-sm font-medium text-gray-800">{email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Password</span>
              <span className="text-sm font-mono font-bold text-brand-700">{password}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">App link</span>
              <span className="text-xs text-gray-600 truncate ml-2">{appUrl}</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* WhatsApp share */}
            <button onClick={shareViaWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Share via WhatsApp
            </button>

            {/* Copy */}
            <button onClick={copyCredentials}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-gray-300 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Credentials
            </button>

            <div className="flex gap-2">
              <button onClick={() => { setDone(false); setEmail(''); setName(''); setRelation(''); setPassword(generatePassword()); setBloodGroup(''); setHeightCm(''); setWeightKg(''); }}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold">
                Add Another
              </button>
              <button onClick={() => router.push('/dashboard')}
                className="flex-1 py-3 rounded-xl bg-brand-700 text-white text-sm font-semibold">
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-700 text-white px-4 pt-10 pb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-brand-200 hover:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold">Add Family Member</h1>
          <p className="text-brand-200 text-sm">Create their account &amp; share via WhatsApp</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-5">

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Their name *</label>
          <input type="text" placeholder="e.g. Amma, Achan, Riya" value={name}
            onChange={e => setName(e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white" />
        </div>

        {/* Relation */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Relation *</label>
          <div className="grid grid-cols-3 gap-2">
            {RELATIONS.map(r => (
              <button key={r.value} type="button" onClick={() => setRelation(r.value)}
                className={`py-2.5 rounded-xl text-sm font-medium border-2 transition ${relation === r.value ? 'border-brand-700 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 bg-white hover:border-brand-300'}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Their email *</label>
          <input type="email" placeholder="their.email@gmail.com" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white" />
        </div>

        {/* Health info (optional) */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Health info <span className="font-normal text-gray-400">(optional — can add later)</span></p>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Blood Group</label>
            <div className="grid grid-cols-4 gap-2">
              {['A+','A−','B+','B−','AB+','AB−','O+','O−'].map(bg => (
                <button key={bg} type="button" onClick={() => setBloodGroup(bloodGroup === bg ? '' : bg)}
                  className={`py-2 rounded-xl text-sm font-semibold border-2 transition ${bloodGroup === bg ? 'border-brand-700 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 bg-white hover:border-brand-300'}`}>
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Height (cm)</label>
              <input type="number" placeholder="e.g. 165" value={heightCm}
                onChange={e => setHeightCm(e.target.value)} min="100" max="250"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Weight (kg)</label>
              <input type="number" placeholder="e.g. 68" value={weightKg}
                onChange={e => setWeightKg(e.target.value)} min="20" max="250"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white" />
            </div>
          </div>
        </div>

        {/* Auto-generated password */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Auto-generated password</label>
          <div className="flex gap-2">
            <div className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 font-mono text-base font-bold text-brand-700 tracking-wider">
              {password}
            </div>
            <button type="button" onClick={() => setPassword(generatePassword())}
              className="px-4 border border-gray-200 rounded-xl bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 transition" title="Regenerate">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">You will share this with them via WhatsApp after creating</p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full py-4 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-semibold text-base disabled:opacity-60 transition">
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
