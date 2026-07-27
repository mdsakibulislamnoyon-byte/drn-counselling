import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client. BYPASSES ROW LEVEL SECURITY — never import
 * this into anything that ships to the browser. Reserved for:
 *   - Stripe / Mux webhook handlers (no user session available)
 *   - Scheduled jobs (drip unlock, appointment reminders)
 *   - Admin analytics queries that intentionally span all users
 * Every call site using this client MUST write an audit_log row (see
 * src/lib/audit.ts) when it touches PHI-adjacent data.
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient() must never be called from the browser.');
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
