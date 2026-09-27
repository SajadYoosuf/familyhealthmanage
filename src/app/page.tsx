'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Step = 'choose' | 'login' | 'signup' | 'profile' | 'family';

const RELATIONS = [
  { value: 'father', label: 'Father', emoji: '👨' },
  { value: 'mother', label: 'Mother', emoji: '👩' },
  { value: 'son', label: 'Son', emoji: '👦' },
  { value: 'daughter', label: 'Daughter', emoji: '👧' },
  { value: 'other', label: 'Other', emoji: '🧑' },
];

const STEP_ORDER: Step[] = ['choose', 'login', 'signup', 'profile', 'family'];

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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = '/dashboard';
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Signup failed');
      setLoading(false);
      return;
    }
    // Sign in client-side so the session is stored in browser cookies
    // (server-side sign-in in /api/auth/signup doesn't reach the browser)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    setStep('profile');
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
    window.location.href = '/dashboard';
  }

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition";

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 via-brand-600 to-teal-500 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Family Health</h1>
          <p className="text-brand-100 text-sm mt-1">Your family medical wallet</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-card-lg overflow-hidden">

          {/* Step indicator for multi-step signup */}
          {(step === 'profile' || step === 'family') && (
            <div className="flex gap-1.5 px-6 pt-5">
              {['signup', 'profile', 'family'].map((s, i) => (
                <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
                  ['signup', 'profile', 'family'].indexOf(step) >= i ? 'bg-brand-500' : 'bg-gray-200'
                }`} />
              ))}
            </div>
          )}

          <div className="p-6">

            {/* Choose */}
            {step === 'choose' && (
              <div className="space-y-4">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Welcome back</h2>
                  <p className="text-sm text-gray-500 mt-1">Sign in or create a new account</p>
                </div>
                <button onClick={() => setStep('login')}
                  className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition shadow-sm">
                  Sign in
                </button>
                <button onClick={() => setStep('signup')}
                  className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-brand-400 hover:text-brand-700 transition">
                  Create account
                </button>
              </div>
            )}

            {/* Login */}
            {step === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-gray-900">Sign in</h2>
                  <p className="text-sm text-gray-500 mt-1">Enter your credentials to continue</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                    <input type="email" placeholder="you@example.com" value={email}
                      onChange={e => setEmail(e.target.value)} required className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
                    <input type="password" placeholder="••••••••" value={password}
                      onChange={e => setPassword(e.target.value)} required className={inputClass} />
                  </div>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm disabled:opacity-60 transition">
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
                <button type="button" onClick={() => setStep('choose')}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition">
                  ← Back
                </button>
              </form>
            )}

            {/* Signup */}
            {step === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-gray-900">Create account</h2>
                  <p className="text-sm text-gray-500 mt-1">Step 1 of 3 — Account details</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                    <input type="email" placeholder="you@example.com" value={email}
                      onChange={e => setEmail(e.target.value)} required className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
                    <input type="password" placeholder="Min 6 characters" value={password}
                      onChange={e => setPassword(e.target.value)} required minLength={6} className={inputClass} />
                  </div>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm disabled:opacity-60 transition">
                  {loading ? 'Creating…' : 'Continue →'}
                </button>
                <button type="button" onClick={() => setStep('choose')}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition">
                  ← Back
                </button>
              </form>
            )}

            {/* Profile */}
            {step === 'profile' && (
              <div className="space-y-4">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-gray-900">Your profile</h2>
                  <p className="text-sm text-gray-500 mt-1">Step 2 of 3 — Who are you?</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Your name</label>
                  <input type="text" placeholder="e.g. Sajad, Amma, Achan" value={name}
                    onChange={e => setName(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Relation</label>
                  <div className="grid grid-cols-3 gap-2">
                    {RELATIONS.map(r => (
                      <button key={r.value} type="button" onClick={() => setRelation(r.value)}
                        className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition flex flex-col items-center gap-0.5 ${
                          relation === r.value
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-gray-200 text-gray-500 bg-white hover:border-brand-300'
                        }`}>
                        <span className="text-base">{r.emoji}</span>
                        <span className="text-xs">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button disabled={!name || !relation}
                  onClick={() => setStep('family')}
                  className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm disabled:opacity-40 transition">
                  Continue →
                </button>
              </div>
            )}

            {/* Family */}
            {step === 'family' && (
              <form onSubmit={handleFamilySetup} className="space-y-4">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-gray-900">Your family</h2>
                  <p className="text-sm text-gray-500 mt-1">Step 3 of 3 — Connect to a family</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFamilyMode('create')}
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition ${
                      familyMode === 'create'
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-500 bg-white'
                    }`}>
                    Create new
                  </button>
                  <button type="button" onClick={() => setFamilyMode('join')}
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition ${
                      familyMode === 'join'
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-500 bg-white'
                    }`}>
                    Join existing
                  </button>
                </div>

                {familyMode === 'create' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Family name</label>
                    <input type="text" placeholder="e.g. Yoosuf Family" value={familyName}
                      onChange={e => setFamilyName(e.target.value)} required className={inputClass} />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Invite code</label>
                    <input type="text" placeholder="Enter invite code" value={inviteCode}
                      onChange={e => setInviteCode(e.target.value.toLowerCase())} required
                      className={`${inputClass} tracking-widest font-mono uppercase`} />
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm disabled:opacity-60 transition">
                  {loading ? 'Setting up…' : familyMode === 'create' ? 'Create Family' : 'Join Family'}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-brand-100/60 text-xs mt-6">
          Secure · Private · Family only
        </p>
      </div>
    </div>
  );
}
