'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/database';

/**
 * accountType is only meaningful on the register page — it's threaded
 * through to /api/auth/callback so a brand-new OAuth signup can be flagged
 * 'student' instead of the default 'patient'. Omit it on the login page.
 */
export function OAuthButtons({ accountType }: { accountType?: Extract<UserRole, 'patient' | 'student'> }) {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'azure' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOAuth(provider: 'google' | 'azure') {
    setLoadingProvider(provider);
    setError(null);

    const redirectTo = new URL('/api/auth/callback', window.location.origin);
    if (accountType) redirectTo.searchParams.set('role', accountType);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo.toString() },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoadingProvider(null);
    }
    // On success the browser is redirected away to the provider — no
    // further action needed here.
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-100" />
        <span className="text-xs text-ink-700">or continue with</span>
        <div className="h-px flex-1 bg-ink-100" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={loadingProvider !== null}
          className="btn-secondary"
        >
          {loadingProvider === 'google' ? 'Redirecting…' : 'Google'}
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('azure')}
          disabled={loadingProvider !== null}
          className="btn-secondary"
        >
          {loadingProvider === 'azure' ? 'Redirecting…' : 'Microsoft'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
