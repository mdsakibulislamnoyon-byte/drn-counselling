import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { CourseEditor } from '@/components/courses/course-editor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProviderCourseEditPage({ params }: PageProps) {
  await requireRole(['provider', 'staff', 'admin']);
  const { id } = await params;

  if (!(await hasPermission('lms.manage_courses'))) {
    return <p className="text-sm text-ink-700">You don&apos;t have permission to manage courses.</p>;
  }

  return (
    <div>
      <Link href="/provider/courses" className="text-sm text-brand-700 underline">
        ← Back to courses
      </Link>
      <h1 className="mt-2 font-serif text-3xl text-ink-900">Edit course</h1>
      <div className="mt-8">
        <CourseEditor courseId={id} />
      </div>
    </div>
  );
}
