import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/permissions';

interface Params {
  params: Promise<{ id: string }>;
}

const schema = z.object({
  title: z.string().trim().min(1),
  position: z.number().int().min(1),
  dripDayOffset: z.number().int().min(0).nullable().optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  const { id: courseId } = await params;
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
  const { title, position, dripDayOffset } = parsed.data;

  const { data: module, error } = await supabase
    .from('course_modules')
    .insert({ course_id: courseId, title, position, drip_day_offset: dripDayOffset ?? null })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: 'Unable to create module (position may already be taken).' }, { status: 400 });
  return NextResponse.json({ id: module.id }, { status: 201 });
}
