import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { Certificate, Course, Enrollment } from '@/types/database';

export default async function StudentCertificatesPage() {
  const profile = await requireRole(['student']);
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, courses(*), certificates(*)')
    .eq('student_id', profile.id)
    .eq('status', 'completed');

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Certificates</h1>

      {!enrollments || enrollments.length === 0 ? (
        <p className="mt-8 text-sm text-ink-700">
          Complete a course to earn your Certificate of Completion.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {(enrollments as unknown as (Enrollment & { courses: Course; certificates: Certificate[] })[]).map((e) => {
            const cert = e.certificates?.[0];
            return (
              <div key={e.id} className="card">
                <h3 className="font-serif text-lg text-ink-900">{e.courses.title}</h3>
                {cert ? (
                  <>
                    <p className="mt-2 text-sm text-ink-700">Certificate #{cert.certificate_number}</p>
                    <p className="text-xs text-ink-700">Issued {format(new Date(cert.issued_at), 'MMM d, yyyy')}</p>
                    <p className="mt-2 text-xs text-brand-700">
                      Mentorship support with Dominick through{' '}
                      {format(new Date(cert.mentorship_expires_at), 'MMM d, yyyy')}
                    </p>
                    <a href={cert.pdf_url ?? '#'} className="btn-secondary mt-4 w-full">
                      Download PDF
                    </a>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-ink-700">Certificate is being generated.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
