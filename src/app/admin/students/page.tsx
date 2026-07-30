import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { StatusPill } from '@/components/dashboard/status-pill';

export default async function AdminStudentsPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, profiles!enrollments_student_id_fkey(full_name, email), courses(title)')
    .order('enrolled_at', { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Student roster</h1>

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink-100">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-700">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Enrolled</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(enrollments ?? []).map((e) => {
              const student = (e as unknown as { profiles: { full_name: string; email: string } }).profiles;
              const course = (e as unknown as { courses: { title: string } }).courses;
              return (
                <tr key={e.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{student?.full_name}</p>
                    <p className="text-xs text-ink-700">{student?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{course?.title}</td>
                  <td className="px-4 py-3 text-ink-700">{format(new Date(e.enrolled_at), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={e.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
