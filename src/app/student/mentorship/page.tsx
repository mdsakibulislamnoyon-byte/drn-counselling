import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { Messenger } from '@/components/messaging/messenger';
import type { Profile } from '@/types/database';

export default async function StudentMentorshipPage() {
  const profile = await requireRole(['student']);
  const supabase = await createClient();

  const { data: hasActiveCertificate } = await supabase
    .from('certificates')
    .select('id, enrollments!inner(student_id)')
    .eq('enrollments.student_id', profile.id)
    .gt('mentorship_expires_at', new Date().toISOString())
    .limit(1);

  const { data: mentors } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'provider')
    .returns<Pick<Profile, 'id' | 'full_name'>[]>();

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Mentorship</h1>
      <p className="mt-1 text-ink-700">
        Message Dominik directly during your included post-course mentorship window.
      </p>

      {(!hasActiveCertificate || hasActiveCertificate.length === 0) && (
        <div className="card mt-6 bg-amber-50">
          <p className="text-sm text-amber-800">
            Mentorship messaging unlocks once you complete a course and is available for the
            included mentorship period shown on your certificate.
          </p>
        </div>
      )}

      <div className="mt-8">
        <Messenger currentUserId={profile.id} recipients={mentors ?? []} defaultContext="mentorship" />
      </div>
    </div>
  );
}
