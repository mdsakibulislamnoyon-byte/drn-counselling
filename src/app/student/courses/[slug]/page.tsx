import Link from 'next/link';
import { format } from 'date-fns';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { LessonVideo } from '@/components/student/lesson-video';
import { MarkCompleteButton } from '@/components/student/mark-complete-button';
import type { Course, CourseModule, Lesson, LessonProgress } from '@/types/database';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}

export default async function StudentCoursePlayerPage({ params, searchParams }: PageProps) {
  const profile = await requireRole(['student']);
  const { slug } = await params;
  const { lesson: selectedLessonId } = await searchParams;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .maybeSingle<Course>();
  if (!course) notFound();

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', profile.id)
    .eq('course_id', course.id)
    .maybeSingle();
  if (!enrollment) redirect('/student');

  const { data: modules } = await supabase
    .from('course_modules')
    .select('*, lessons(*)')
    .eq('course_id', course.id)
    .order('position')
    .returns<(CourseModule & { lessons: Lesson[] })[]>();

  const { data: progressRows } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('enrollment_id', enrollment.id)
    .returns<LessonProgress[]>();

  const progressByLesson = new Map((progressRows ?? []).map((p) => [p.lesson_id, p]));

  const allLessons = (modules ?? []).flatMap((m) => m.lessons ?? []).sort((a, b) => a.position - b.position);
  const activeLesson =
    allLessons.find((l) => l.id === selectedLessonId) ??
    allLessons.find((l) => progressByLesson.get(l.id)?.status !== 'locked') ??
    allLessons[0];
  const activeProgress = activeLesson ? progressByLesson.get(activeLesson.id) : undefined;
  const isUnlocked = activeProgress && activeProgress.status !== 'locked';

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Course</p>
          <h1 className="font-serif text-xl text-ink-900">{course.title}</h1>
        </div>
        {(modules ?? []).map((mod, i) => (
          <div key={mod.id}>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-700">
              Module {i + 1} · {mod.title}
            </p>
            <ul className="mt-2 space-y-1">
              {(mod.lessons ?? [])
                .sort((a, b) => a.position - b.position)
                .map((lesson) => {
                  const p = progressByLesson.get(lesson.id);
                  const locked = !p || p.status === 'locked';
                  return (
                    <li key={lesson.id}>
                      {locked ? (
                        <span className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700/50">
                          🔒 {lesson.title}
                        </span>
                      ) : (
                        <Link
                          href={`/student/courses/${slug}?lesson=${lesson.id}`}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                            activeLesson?.id === lesson.id ? 'bg-brand-50 text-brand-800' : 'text-ink-700 hover:bg-ink-50'
                          }`}
                        >
                          {p?.status === 'completed' ? '✅' : '▶️'} {lesson.title}
                        </Link>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </aside>

      <div>
        {!activeLesson ? (
          <p className="text-sm text-ink-700">This course doesn&apos;t have any lessons yet.</p>
        ) : !isUnlocked ? (
          <div className="card">
            <p className="text-sm text-ink-700">
              This lesson unlocks {activeProgress?.unlocked_at ? `on ${format(new Date(activeProgress.unlocked_at), 'MMM d, yyyy')}` : 'soon'}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeLesson.mux_playback_id && <LessonVideo playbackId={activeLesson.mux_playback_id} />}
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-ink-900">{activeLesson.title}</h2>
              <MarkCompleteButton lessonId={activeLesson.id} completed={activeProgress?.status === 'completed'} />
            </div>
            {activeLesson.content_md && (
              <div className="prose prose-ink whitespace-pre-wrap text-sm text-ink-700">
                {activeLesson.content_md}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
