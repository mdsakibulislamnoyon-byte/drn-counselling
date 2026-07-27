import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Course } from '@/types/database';

export const metadata: Metadata = { title: 'Course Catalog' };
export const revalidate = 60;

export default async function CourseCatalogPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .returns<Course[]>();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-serif text-4xl text-ink-900">Course catalog</h1>
      <p className="mt-4 max-w-2xl text-ink-700">
        Professional development courses for newly graduated mental health clinicians. Content
        unlocks week-by-week after enrollment, and every course includes a year of post-completion
        mentorship messaging with Dominik.
      </p>

      {!courses || courses.length === 0 ? (
        <p className="mt-12 text-ink-700">
          New courses are being finalized — check back soon, or{' '}
          <Link href="/contact" className="text-brand-700 underline">
            contact us
          </Link>{' '}
          to be notified at launch.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="card flex flex-col transition-shadow hover:shadow-md"
            >
              <div className="aspect-video rounded-xl bg-brand-100" />
              <h3 className="mt-4 font-serif text-lg text-ink-900">{course.title}</h3>
              <p className="mt-2 flex-1 text-sm text-ink-700">{course.subtitle}</p>
              <p className="mt-4 text-lg font-semibold text-brand-700">
                ${(course.price_cents / 100).toFixed(2)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
