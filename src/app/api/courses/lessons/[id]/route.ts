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
  contentMd: z.string().nullable().optional(),
  videoUrl: z.string().trim().url().nullable().optional(),
  muxPlaybackId: z.string().trim().nullable().optional(),
  durationSeconds: z.number().int().min(0).nullable().optional(),
  isPreview: z.boolean().optional(),
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
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  const v = parsed.data;

  const { error } = await supabase
    .from('lessons')
    .update({
      ...(v.title !== undefined ? { title: v.title } : {}),
      ...(v.position !== undefined ? { position: v.position } : {}),
      ...(v.contentMd !== undefined ? { content_md: v.contentMd } : {}),
      ...(v.videoUrl !== undefined ? { video_url: v.videoUrl } : {}),
      ...(v.muxPlaybackId !== undefined ? { mux_playback_id: v.muxPlaybackId } : {}),
      ...(v.durationSeconds !== undefined ? { duration_seconds: v.durationSeconds } : {}),
      ...(v.isPreview !== undefined ? { is_preview: v.isPreview } : {}),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Unable to update lesson.' }, { status: 500 });
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

  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Unable to delete lesson.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
