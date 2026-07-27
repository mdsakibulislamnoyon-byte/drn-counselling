import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { Course, CourseModule, Lesson } from '@/types/database';
import { EnrollButton } from '@/components/marketing/enroll-button';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCourse(slug: string) {
  const supabase = await createClient();
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle<Course>();

  if (!course) return null;

  const { data: modules } = await supabase
    .from('course_modules')
    .select('*, lessons(*)')
    .eq('course_id', course.id)
    .order('position')
    .returns<(CourseModule & { lessons: Lesson[] })[]>();

  return { course, modules: modules ?? [] };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCourse(slug);
  return { title: data?.course.title ?? 'Course' };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getCourse(slug);
  if (!data) notFound();

  const { course, modules } = data;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid gap-10 md:grid-cols-3">
        <div className="md:col-span-2">
          {course.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnail_url}
              alt=""
              className="mb-6 aspect-video w-full rounded-2xl object-cover"
            />
          )}
          <h1 className="font-serif text-4xl text-ink-900">{course.title}</h1>
          <p className="mt-3 text-lg text-ink-700">{course.subtitle}</p>
          <div className="prose prose-ink mt-8 whitespace-pre-wrap text-ink-700">
            {course.description_md}
          </div>

          <h2 className="mt-12 font-serif text-2xl text-ink-900">Curriculum</h2>
          <p className="mt-2 text-sm text-ink-700">
            New modules unlock every {course.drip_interval_days} days after enrollment.
          </p>
          <div className="mt-6 space-y-4">
            {modules.map((mod, i) => (
              <div key={mod.id} className="card">
                <p className="text-sm font-semibold text-brand-700">
                  Module {i + 1} — unlocks day {mod.drip_day_offset ?? i * course.drip_interval_days}
                </p>
                <p className="mt-1 font-serif text-lg text-ink-900">{mod.title}</p>
                <ul className="mt-3 space-y-1 text-sm text-ink-700">
                  {mod.lessons
                    ?.sort((a, b) => a.position - b.position)
                    .map((lesson) => (
                      <li key={lesson.id} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                        {lesson.title}
                        {lesson.is_preview && (
                          <span className="badge bg-brand-50 text-brand-700">Preview</span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-ink-100 p-6 shadow-sm">
          <p className="text-3xl font-semibold text-ink-900">
            ${(course.price_cents / 100).toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-ink-700">
            One-time payment or installments · promo codes accepted at checkout
          </p>
          <EnrollButton courseId={course.id} />
          <p className="mt-4 text-xs text-ink-700">
            Includes {course.mentorship_months} months of post-course mentorship messaging with
            Dominik.
          </p>
        </aside>
      </div>
    </div>
  );
}
