import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  fullName: z.string().trim().min(2).optional(),
  phone: z.string().trim().min(7).max(20).nullable().optional(),
  timezone: z.string().trim().min(1).optional(),
});

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const { fullName, phone, timezone } = parsed.data;
  const { error } = await supabase
    .from('profiles')
    .update({
      ...(fullName !== undefined ? { full_name: fullName } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(timezone !== undefined ? { timezone } : {}),
    })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: 'Unable to update profile.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
