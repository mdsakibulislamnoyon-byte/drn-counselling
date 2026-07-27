import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { CourseEditor } from '@/components/courses/course-editor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCourseEditPage({ params }: PageProps) {
  await requireRole(['admin']);
  const { id } = await params;

  return (
    <div>
      <Link href="/admin/courses" className="text-sm text-brand-700 underline">
        ← Back to courses
      </Link>
      <h1 className="mt-2 font-serif text-3xl text-ink-900">Edit course</h1>
      <div className="mt-8">
        <CourseEditor courseId={id} />
      </div>
    </div>
  );
}
