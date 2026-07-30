import Link from 'next/link';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { Course, Enrollment, LessonProgress, Certificate } from '@/types/database';
import { StatusPill } from '@/components/dashboard/status-pill';
import { StaggerGroup, StaggerItem, FadeIn } from '@/components/motion/fade-in';

export default async function StudentDashboardPage() {
  const profile = await requireRole(['student']);
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('student_id', profile.id)
    .order('enrolled_at', { ascending: false });

  const typedEnrollments = (enrollments ?? []) as unknown as (Enrollment & { courses: Course })[];
  const primary = typedEnrollments.find((e) => e.status === 'active') ?? typedEnrollments[0];
  const rest = typedEnrollments.filter((e) => e.id !== primary?.id);

  let progressPct = 0;
  let nextLesson: { id: string; title: string; moduleTitle: string } | null = null;
  let certificate: Certificate | null = null;

  if (primary) {
    const { data: progressRows } = await supabase
      .from('lesson_progress')
      .select('*, lessons(title, course_modules(title, position), position)')
      .eq('enrollment_id', primary.id)
      .returns<(LessonProgress & { lessons: { title: string; position: number; course_modules: { title: string; position: number } } })[]>();

    const rows = progressRows ?? [];
    const completedCount = rows.filter((r) => r.status === 'completed').length;
    progressPct = rows.length > 0 ? Math.round((completedCount / rows.length) * 100) : 0;

    const upNext = rows
      .filter((r) => r.status === 'available' || r.status === 'in_progress')
      .sort((a, b) => a.lessons.course_modules.position - b.lessons.course_modules.position || a.lessons.position - b.lessons.position)[0];

    if (upNext) {
      nextLesson = { id: upNext.lesson_id, title: upNext.lessons.title, moduleTitle: upNext.lessons.course_modules.title };
    }

    if (primary.status === 'completed') {
      const { data: cert } = await supabase.from('certificates').select('*').eq('enrollment_id', primary.id).maybeSingle();
      certificate = cert as Certificate | null;
    }
  }

  const { data: moreCourses } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .not('id', 'in', `(${typedEnrollments.map((e) => e.course_id).join(',') || '00000000-0000-0000-0000-000000000000'})`)
    .limit(2)
    .returns<Course[]>();

  return (
    <div>
      <p className="eyebrow">Welcome back</p>
      <h1 className="mt-1 font-serif text-3xl text-ink-900">Keep going, {profile.full_name.split(' ')[0]}.</h1>

      {!primary ? (
        <FadeIn className="card mt-8">
          <p className="text-sm text-ink-700">You aren&apos;t enrolled in any courses yet.</p>
          <Link href="/courses" className="btn-primary mt-4 inline-flex">Browse the catalog</Link>
        </FadeIn>
      ) : (
        <>
          <FadeIn className="card mt-6">
            <p className="eyebrow">Continue learning</p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex aspect-video w-full shrink-0 items-center justify-center rounded-xl bg-mint/40 sm:w-48">
                {primary.courses.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={primary.courses.thumbnail_url} alt="" className="h-full w-full rounded-xl object-cover" />
                ) : (
                  <span className="font-serif text-3xl text-brand-800">✦</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-xl text-ink-900">{primary.courses.title}</h2>
                {nextLesson ? (
                  <p className="mt-1 text-sm text-ink-700">
                    Next: {nextLesson.moduleTitle} — {nextLesson.title}
                  </p>
                ) : (
                  <div className="mt-1"><StatusPill status={primary.status} /></div>
                )}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="mt-1 text-xs text-ink-700">{progressPct}% complete</p>
                {nextLesson && (
                  <Link
                    href={`/student/courses/${primary.courses.slug}?lesson=${nextLesson.id}`}
                    className="btn-primary mt-3 inline-flex"
                  >
                    Resume course
                  </Link>
                )}
              </div>
            </div>
          </FadeIn>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {certificate ? (
              <FadeIn className="card bg-mint/25">
                <p className="eyebrow">Your certificate</p>
                <h2 className="font-serif text-lg text-ink-900">Certificate #{certificate.certificate_number}</h2>
                <p className="mt-1 text-sm text-ink-700">Issued {format(new Date(certificate.issued_at), 'MMM d, yyyy')}</p>
                <p className="mt-1 text-xs text-brand-700">
                  Mentorship support through {format(new Date(certificate.mentorship_expires_at), 'MMM d, yyyy')}
                </p>
                <Link href="/student/certificates" className="btn-secondary mt-3 inline-flex">
                  View certificates
                </Link>
              </FadeIn>
            ) : (
              <FadeIn className="card bg-coral/15">
                <p className="eyebrow">Your certificate</p>
                <h2 className="font-serif text-lg text-ink-900">Finish all lessons to unlock it</h2>
                <p className="mt-1 text-sm text-ink-700">{progressPct}% of the way there — keep going.</p>
              </FadeIn>
            )}

            <FadeIn delay={0.1} className="card bg-ink-900 text-white">
              <p className="eyebrow text-mint">One year of support</p>
              <h2 className="font-serif text-lg text-white">Questions while you learn?</h2>
              <p className="mt-1 text-sm text-white/70">
                Complete the course, then message Dominick directly for a year afterward.
              </p>
              <Link href="/student/mentorship" className="mt-3 inline-block text-sm font-medium text-mint underline">
                Learn about mentorship →
              </Link>
            </FadeIn>
          </div>
        </>
      )}

      {rest.length > 0 && (
        <div className="mt-8">
          <p className="eyebrow">Your courses</p>
          <StaggerGroup className="mt-3 grid gap-6 sm:grid-cols-2" staggerDelay={0.06}>
            {rest.map((e) => (
              <StaggerItem key={e.id}>
                <Link href={`/student/courses/${e.courses.slug}`} className="card card-hover block h-full">
                  {e.courses.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.courses.thumbnail_url} alt="" className="aspect-video w-full rounded-xl object-cover" />
                  ) : (
                    <div className="aspect-video rounded-xl bg-mint/40" />
                  )}
                  <h3 className="mt-4 font-serif text-lg text-ink-900">{e.courses.title}</h3>
                  <div className="mt-2"><StatusPill status={e.status} /></div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      )}

      {moreCourses && moreCourses.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Keep exploring</p>
            <Link href="/courses" className="text-sm text-brand-700 underline">
              View catalogue
            </Link>
          </div>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {moreCourses.map((c) => (
              <Link key={c.id} href={`/courses/${c.slug}`} className="card card-hover flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">{c.title}</p>
                  <p className="text-xs text-ink-700">${(c.price_cents / 100).toFixed(2)} · Self-paced</p>
                </div>
                <span className="text-brand-700">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
