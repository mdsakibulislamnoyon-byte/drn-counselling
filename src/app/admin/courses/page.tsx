import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { Course } from '@/types/database';
import { CreateCourseForm } from './create-course-form';
import { PublishToggle } from './publish-toggle';

export default async function AdminCoursesPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Course[]>();

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Courses</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {(courses ?? []).map((c) => (
            <div key={c.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-900">{c.title}</p>
                <p className="text-xs text-ink-700">/{c.slug} · ${(c.price_cents / 100).toFixed(2)}</p>
              </div>
              <PublishToggle courseId={c.id} isPublished={c.is_published} />
            </div>
          ))}
          {(!courses || courses.length === 0) && <p className="text-sm text-ink-700">No courses yet.</p>}
        </div>

        <div className="card h-fit">
          <h2 className="font-serif text-lg text-ink-900">New course</h2>
          <CreateCourseForm />
        </div>
      </div>
    </div>
  );
}
