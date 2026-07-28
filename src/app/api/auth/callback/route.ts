import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { roleHomePath } from '@/lib/auth';
import type { UserRole } from '@/types/database';

/**
 * OAuth (Google/Microsoft) redirect target. Exchanges the PKCE `code` for a
 * session — the code_verifier @supabase/ssr stored in a cookie when the
 * browser client kicked off signInWithOAuth() is read from this request's
 * cookies automatically by the server client below.
 *
 * `role` is an optional query param set by the register page (see
 * oauth-buttons.tsx) to say which self-service account type the user picked
 * before being sent to the provider. It is applied ONLY to brand-new
 * accounts and ONLY to 'student' — every other value is ignored — mirroring
 * the same restriction the password-based signup trigger enforces at the
 * database level (self-service can never become provider/staff/admin).
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const requestedRole = request.nextUrl.searchParams.get('role');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', siteUrl));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', siteUrl));
  }

  const { user } = data;

  // A brand-new account's auth record is created and immediately signed in
  // in the same instant; a returning user's created_at will be far older
  // than this sign-in. 30s is a generous window for the redirect round trip.
  const isNewSignup =
    !!user.created_at &&
    !!user.last_sign_in_at &&
    Math.abs(new Date(user.last_sign_in_at).getTime() - new Date(user.created_at).getTime()) < 30_000;

  let role: UserRole = 'patient';

  if (isNewSignup && requestedRole === 'student') {
    // profiles_update_own's RLS policy intentionally blocks a user from
    // changing their own role — this is the one controlled server-side
    // exception, hardcoded to 'student' only, applied once at signup.
    const admin = createAdminClient();
    const { error: promoteError } = await admin.from('profiles').update({ role: 'student' }).eq('id', user.id);
    if (!promoteError) role = 'student';
  } else if (!isNewSignup) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile) role = profile.role;
  }

  const destination = isNewSignup ? `${roleHomePath(role)}/onboarding/consent` : roleHomePath(role);
  return NextResponse.redirect(new URL(destination, siteUrl));
}
