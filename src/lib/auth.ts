import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile, UserRole } from '@/types/database';

/** Current signed-in user's profile, or null when logged out. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as Profile | null;
}

/** Redirects to /login if signed out, or to /onboarding/consent if HIPAA consent is missing. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  return profile;
}

/** Guards a route to a set of allowed roles, redirecting others to their own home. */
export async function requireRole(allowed: UserRole[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!allowed.includes(profile.role)) {
    redirect(roleHomePath(profile.role));
  }
  return profile;
}

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case 'patient':
      return '/portal';
    case 'provider':
    case 'staff':
      return '/provider';
    case 'student':
      return '/student';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
}

/** Has this patient/student signed the current HIPAA + privacy consent documents? */
export async function hasCurrentConsent(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: currentDocs } = await supabase
    .from('consent_documents')
    .select('id')
    .eq('is_current', true);

  if (!currentDocs || currentDocs.length === 0) return true;

  const { data: signed } = await supabase
    .from('hipaa_consents')
    .select('consent_document_id')
    .eq('user_id', userId)
    .is('revoked_at', null);

  const signedIds = new Set((signed ?? []).map((r) => r.consent_document_id));
  return currentDocs.every((doc) => signedIds.has(doc.id));
}
