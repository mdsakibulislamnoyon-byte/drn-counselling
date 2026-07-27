import { createClient } from '@/lib/supabase/server';

/** Checks the caller's flattened permission grid (see effective_permissions view). */
export async function hasPermission(permissionKey: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('effective_permissions')
    .select('permission_key')
    .eq('user_id', user.id)
    .eq('permission_key', permissionKey)
    .maybeSingle();

  return !error && !!data;
}
