import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { Messenger } from '@/components/messaging/messenger';
import type { Profile } from '@/types/database';

export default async function PatientMessagesPage() {
  const profile = await requireRole(['patient']);
  const supabase = await createClient();

  // RLS (profiles_select_providers_public) only exposes provider profiles to
  // patients; staff are reached indirectly once a provider loops them in.
  const { data: careTeam } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'provider')
    .returns<Pick<Profile, 'id' | 'full_name'>[]>();

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Messages</h1>
      <p className="mt-1 text-ink-700">Secure, encrypted messaging with your care team.</p>
      <div className="mt-8">
        <Messenger currentUserId={profile.id} recipients={careTeam ?? []} defaultContext="clinical" />
      </div>
    </div>
  );
}
