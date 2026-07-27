import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/permissions';

interface Params {
  params: Promise<{ id: string }>;
}

const schema = z.object({
  title: z.string().trim().min(1),
  url: z.string().trim().url(),
  position: z.number().int().min(0).optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  const { id: lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!(await hasPermission('lms.manage_courses'))) {
    return NextResponse.json({ error: 'You do not have permission to manage courses.' }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  const { title, url, position } = parsed.data;

  const { data: resource, error } = await supabase
    .from('lesson_resources')
    .insert({ lesson_id: lessonId, title, url, position: position ?? 0 })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: 'Unable to add resource.' }, { status: 500 });
  return NextResponse.json({ id: resource.id }, { status: 201 });
}
