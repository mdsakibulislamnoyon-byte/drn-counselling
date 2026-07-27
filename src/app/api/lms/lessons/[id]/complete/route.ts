import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Marks a lesson complete for the caller's own enrollment, then checks
 * whether the whole course is now finished (issuing a certificate if so)
 * via the maybe_complete_enrollment() Postgres function.
 */
export async function POST(_request: NextRequest, { params }: Params) {
  const { id: lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, module_id, course_modules(course_id)')
    .eq('id', lessonId)
    .maybeSingle();

  const courseId = (lesson as unknown as { course_modules: { course_id: string } } | null)
    ?.course_modules?.course_id;
  if (!lesson || !courseId) {
    return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
  }

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json({ error: 'You are not enrolled in this course.' }, { status: 403 });
  }

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('status')
    .eq('enrollment_id', enrollment.id)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (!progress || progress.status === 'locked') {
    return NextResponse.json({ error: 'This lesson is not unlocked yet.' }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from('lesson_progress')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('enrollment_id', enrollment.id)
    .eq('lesson_id', lessonId);

  if (updateError) {
    return NextResponse.json({ error: 'Unable to update progress.' }, { status: 500 });
  }

  const { data: courseCompleted } = await supabase.rpc('maybe_complete_enrollment', {
    target_enrollment_id: enrollment.id,
  });

  return NextResponse.json({ success: true, courseCompleted: !!courseCompleted });
}
