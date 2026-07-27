import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  title: z.string().trim().min(2),
  subtitle: z.string().trim().optional(),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  descriptionMd: z.string().trim().default(''),
  priceCents: z.number().int().min(0),
  dripIntervalDays: z.number().int().min(0).default(7),
  mentorshipMonths: z.number().int().min(0).default(12),
});

/** Requires lms.manage_courses (granted to admin by default, and any staff an admin has opted in). */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  const { title, subtitle, slug, descriptionMd, priceCents, dripIntervalDays, mentorshipMonths } = parsed.data;

  const { data: course, error } = await supabase
    .from('courses')
    .insert({
      title,
      subtitle: subtitle ?? null,
      slug,
      description_md: descriptionMd,
      price_cents: priceCents,
      drip_interval_days: dripIntervalDays,
      mentorship_months: mentorshipMonths,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: 'Unable to create course (slug may already be in use).' }, { status: 400 });
  return NextResponse.json({ id: course.id }, { status: 201 });
}
