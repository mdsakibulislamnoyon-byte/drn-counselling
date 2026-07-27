import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client. Uses the anon key, so every query it makes
 * is still subject to RLS — safe to import from Client Components.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
