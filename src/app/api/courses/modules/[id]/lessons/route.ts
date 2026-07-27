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
  contentMd: z.string().trim().optional(),
  videoUrl: z.string().trim().url().optional(),
  muxPlaybackId: z.string().trim().optional(),
  durationSeconds: z.number().int().min(0).optional(),
  isPreview: z.boolean().optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  const { id: moduleId } = await params;
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
  const v = parsed.data;

  const { data: lesson, error } = await supabase
    .from('lessons')
    .insert({
      module_id: moduleId,
      title: v.title,
      position: v.position,
      content_md: v.contentMd ?? null,
      video_url: v.videoUrl ?? null,
      mux_playback_id: v.muxPlaybackId ?? null,
      duration_seconds: v.durationSeconds ?? null,
      is_preview: v.isPreview ?? false,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: 'Unable to create lesson (position may already be taken).' }, { status: 400 });
  return NextResponse.json({ id: lesson.id }, { status: 201 });
}
