'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Step = 'choose' | 'login' | 'signup' | 'profile' | 'family';

const RELATIONS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'other', label: 'Other' },
];

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [familyMode, setFamilyMode] = useState<'create' | 'join'>('create');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
    setLoading(false);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      setUserId(data.user.id);
      setStep('profile');
    }
    setLoading(false);
  }

  async function handleFamilySetup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/family', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, relation, familyMode, familyName, inviteCode }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Something went wrong');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-700 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Family Health</h1>
          <p className="text-sm text-gray-500 mt-1">Your family medical wallet</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">

          {/* Step: Choose */}
          {step === 'choose' && (
            <div className="space-y-3">
              <button onClick={() => setStep('login')}
                className="w-full py-3 rounded-xl bg-brand-700 text-white font-semibold hover:bg-brand-800 transition">
                Login
              </button>
              <button onClick={() => setStep('signup')}
                className="w-full py-3 rounded-xl border-2 border-brand-700 text-brand-700 font-semibold hover:bg-brand-50 transition">
                Create Account
              </button>
            </div>
          )}

          {/* Step: Login */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Welcome back</h2>
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-brand-700 text-white font-semibold disabled:opacity-60">
                {loading ? 'Logging in…' : 'Login'}
              </button>
              <button type="button" onClick={() => setStep('choose')} className="w-full text-sm text-gray-500 hover:text-gray-700">
                ← Back
              </button>
            </form>
          )}

          {/* Step: Signup */}
          {step === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Create account</h2>
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
              <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-brand-700 text-white font-semibold disabled:opacity-60">
                {loading ? 'Creating…' : 'Continue'}
              </button>
              <button type="button" onClick={() => setStep('choose')} className="w-full text-sm text-gray-500 hover:text-gray-700">
                ← Back
              </button>
            </form>
          )}

          {/* Step: Profile */}
          {step === 'profile' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Your profile</h2>
              <input type="text" placeholder="Your name (e.g. Sajad)" value={name} onChange={e => setName(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
              <div className="grid grid-cols-3 gap-2">
                {RELATIONS.map(r => (
                  <button key={r.value} type="button" onClick={() => setRelation(r.value)}
                    className={`py-2 rounded-xl text-sm font-medium border-2 transition ${relation === r.value ? 'border-brand-700 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-brand-300'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
              <button disabled={!name || !relation}
                onClick={() => setStep('family')}
                className="w-full py-3 rounded-xl bg-brand-700 text-white font-semibold disabled:opacity-40">
                Continue
              </button>
            </div>
          )}

          {/* Step: Family */}
          {step === 'family' && (
            <form onSubmit={handleFamilySetup} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Your family</h2>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setFamilyMode('create')}
                  className={`py-2 rounded-xl text-sm font-medium border-2 transition ${familyMode === 'create' ? 'border-brand-700 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}>
                  Create new
                </button>
                <button type="button" onClick={() => setFamilyMode('join')}
                  className={`py-2 rounded-xl text-sm font-medium border-2 transition ${familyMode === 'join' ? 'border-brand-700 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}>
                  Join existing
                </button>
              </div>

              {familyMode === 'create' ? (
                <input type="text" placeholder="Family name (e.g. Yoosuf Family)" value={familyName} onChange={e => setFamilyName(e.target.value)} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
              ) : (
                <input type="text" placeholder="Invite code (from family member)" value={inviteCode} onChange={e => setInviteCode(e.target.value.toLowerCase())} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 tracking-widest font-mono" />
              )}

              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-brand-700 text-white font-semibold disabled:opacity-60">
                {loading ? 'Setting up…' : familyMode === 'create' ? 'Create Family' : 'Join Family'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
