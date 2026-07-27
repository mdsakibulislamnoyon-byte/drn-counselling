import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/permissions';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Full course detail for the content editor (course + modules + lessons +
 * resources), used by both /admin/courses/[id] and /provider/courses/[id].
 * Distinct from the public catalog query in (marketing)/courses/[slug],
 * which only needs published, patient-facing fields.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!(await hasPermission('lms.manage_courses'))) {
    return NextResponse.json({ error: 'You do not have permission to manage courses.' }, { status: 403 });
  }

  const { data: course, error } = await supabase.from('courses').select('*').eq('id', id).maybeSingle();
  if (error || !course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });

  const { data: modules } = await supabase
    .from('course_modules')
    .select('*, lessons(*, lesson_resources(*))')
    .eq('course_id', id)
    .order('position');

  return NextResponse.json({ course, modules: modules ?? [] });
}

const updateSchema = z.object({
  title: z.string().trim().min(2).optional(),
  subtitle: z.string().trim().nullable().optional(),
  descriptionMd: z.string().optional(),
  thumbnailUrl: z.string().trim().url().nullable().optional(),
  priceCents: z.number().int().min(0).optional(),
  dripIntervalDays: z.number().int().min(0).optional(),
  mentorshipMonths: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
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

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  const v = parsed.data;

  const { error } = await supabase
    .from('courses')
    .update({
      ...(v.title !== undefined ? { title: v.title } : {}),
      ...(v.subtitle !== undefined ? { subtitle: v.subtitle } : {}),
      ...(v.descriptionMd !== undefined ? { description_md: v.descriptionMd } : {}),
      ...(v.thumbnailUrl !== undefined ? { thumbnail_url: v.thumbnailUrl } : {}),
      ...(v.priceCents !== undefined ? { price_cents: v.priceCents } : {}),
      ...(v.dripIntervalDays !== undefined ? { drip_interval_days: v.dripIntervalDays } : {}),
      ...(v.mentorshipMonths !== undefined ? { mentorship_months: v.mentorshipMonths } : {}),
      ...(v.isPublished !== undefined ? { is_published: v.isPublished } : {}),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Unable to update course.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
