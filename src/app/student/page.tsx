import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { Course, Enrollment } from '@/types/database';
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

  return (
    <div>
      <p className="eyebrow">Student portal</p>
      <h1 className="mt-1 font-serif text-3xl text-ink-900">My courses</h1>

      {!enrollments || enrollments.length === 0 ? (
        <FadeIn className="card mt-8">
          <p className="text-sm text-ink-700">You aren&apos;t enrolled in any courses yet.</p>
          <Link href="/courses" className="btn-primary mt-4 inline-flex">Browse the catalog</Link>
        </FadeIn>
      ) : (
        <StaggerGroup className="mt-8 grid gap-6 sm:grid-cols-2" staggerDelay={0.06}>
          {(enrollments as unknown as (Enrollment & { courses: Course })[]).map((e) => (
            <StaggerItem key={e.id}>
              <Link href={`/student/courses/${e.courses.slug}`} className="card card-hover block h-full">
                {e.courses.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.courses.thumbnail_url} alt="" className="aspect-video w-full rounded-xl object-cover" />
                ) : (
                  <div className="aspect-video rounded-xl bg-mint/40" />
                )}
                <h3 className="mt-4 font-serif text-lg text-ink-900">{e.courses.title}</h3>
                <div className="mt-2">
                  <StatusPill status={e.status} />
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}
