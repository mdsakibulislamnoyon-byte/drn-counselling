import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { Course, Enrollment } from '@/types/database';

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
      <h1 className="font-serif text-3xl text-ink-900">My courses</h1>

      {!enrollments || enrollments.length === 0 ? (
        <div className="card mt-8">
          <p className="text-sm text-ink-700">You aren&apos;t enrolled in any courses yet.</p>
          <Link href="/courses" className="btn-primary mt-4 inline-flex">Browse the catalog</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {(enrollments as unknown as (Enrollment & { courses: Course })[]).map((e) => (
            <Link key={e.id} href={`/student/courses/${e.courses.slug}`} className="card hover:shadow-md">
              <div className="aspect-video rounded-xl bg-brand-100" />
              <h3 className="mt-4 font-serif text-lg text-ink-900">{e.courses.title}</h3>
              <span className={`badge mt-2 capitalize ${e.status === 'completed' ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-700'}`}>
                {e.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
