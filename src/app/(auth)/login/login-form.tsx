'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { OAuthButtons } from '@/components/auth/oauth-buttons';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'oauth_failed' ? 'Sign-in with that provider failed. Please try again.' : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const redirectParam = searchParams.get('redirect');
    if (redirectParam) {
      router.push(redirectParam);
      router.refresh();
      return;
    }

    // No explicit redirect target — look up the account's role and send it
    // straight to the right portal. Falling back to '/portal' would also
    // work (middleware bounces a role mismatch to the correct home), but
    // this avoids the extra redirect hop.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', signInData.user.id)
      .single();

    const roleHome: Record<string, string> = {
      patient: '/portal',
      provider: '/provider',
      staff: '/provider',
      student: '/student',
      admin: '/admin',
    };

    router.push(roleHome[profile?.role ?? 'patient'] ?? '/portal');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? 'Logging in…' : 'Log in'}
      </button>

      <OAuthButtons />

      <p className="text-center text-sm text-ink-700">
        Don&apos;t have an account?{' '}
        <a href="/register" className="font-medium text-brand-700 underline">Sign up</a>
      </p>
    </form>
  );
}
