import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

interface Params {
  params: Promise<{ id: string }>;
}

const schema = z.object({
  role: z.enum(['patient', 'provider', 'staff', 'student', 'admin']).optional(),
  isActive: z.boolean().optional(),
  permissionOverrides: z
    .array(z.object({ permissionKey: z.string(), granted: z.boolean() }))
    .optional(),
});

/**
 * Admin-only: change a user's base role and/or grant/revoke individual
 * permission overrides. Relies on the `profiles_admin_manage` and
 * `user_permission_overrides_admin_only` RLS policies — a non-admin caller's
 * update is rejected by Postgres itself, not just hidden in the UI.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { role, isActive, permissionOverrides } = parsed.data;

  if (role !== undefined || isActive !== undefined) {
    const { error } = await supabase
      .from('profiles')
      .update({ ...(role !== undefined ? { role } : {}), ...(isActive !== undefined ? { is_active: isActive } : {}) })
      .eq('id', id);
    if (error) return NextResponse.json({ error: 'Unable to update user.' }, { status: 500 });
  }

  if (permissionOverrides && permissionOverrides.length > 0) {
    const { error } = await supabase.from('user_permission_overrides').upsert(
      permissionOverrides.map((o) => ({
        user_id: id,
        permission_key: o.permissionKey,
        granted: o.granted,
        granted_by: user.id,
      }))
    );
    if (error) return NextResponse.json({ error: 'Unable to update permissions.' }, { status: 500 });
  }

  await logAudit({ actorId: user.id, action: 'update', entityType: 'profile', entityId: id, metadata: parsed.data });

  return NextResponse.json({ success: true });
}
