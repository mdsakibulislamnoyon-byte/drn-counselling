'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function RegisterForm() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<'patient' | 'student'>('patient');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: accountType } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const destination = accountType === 'student' ? '/student/onboarding/consent' : '/portal/onboarding/consent';
    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label className="label">I&apos;m here as a</label>
        <div className="grid grid-cols-2 gap-3">
          {(['patient', 'student'] as const).map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setAccountType(type)}
              className={`rounded-xl border px-4 py-3 text-sm font-medium capitalize transition-colors ${
                accountType === type
                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                  : 'border-ink-100 text-ink-700 hover:border-brand-300'
              }`}
            >
              {type === 'patient' ? 'Patient' : 'Student / trainee'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          className="input"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? 'Creating account…' : 'Continue to HIPAA consent'}
      </button>

      <p className="text-center text-sm text-ink-700">
        Already have an account?{' '}
        <a href="/login" className="font-medium text-brand-700 underline">Log in</a>
      </p>
    </form>
  );
}
