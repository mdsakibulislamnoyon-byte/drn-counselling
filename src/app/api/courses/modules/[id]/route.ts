import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/permissions';

interface Params {
  params: Promise<{ id: string }>;
}

const schema = z.object({
  title: z.string().trim().min(1).optional(),
  position: z.number().int().min(1).optional(),
  dripDayOffset: z.number().int().min(0).nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!(await hasPermission('lms.manage_courses'))) {
    return NextResponse.json({ error: 'You do not have permission to manage courses.' }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const v = parsed.data;

  const { error } = await supabase
    .from('course_modules')
    .update({
      ...(v.title !== undefined ? { title: v.title } : {}),
      ...(v.position !== undefined ? { position: v.position } : {}),
      ...(v.dripDayOffset !== undefined ? { drip_day_offset: v.dripDayOffset } : {}),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Unable to update module.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!(await hasPermission('lms.manage_courses'))) {
    return NextResponse.json({ error: 'You do not have permission to manage courses.' }, { status: 403 });
  }

  const { error } = await supabase.from('course_modules').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Unable to delete module.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
