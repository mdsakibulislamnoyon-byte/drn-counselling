import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { Messenger } from '@/components/messaging/messenger';

export default async function ProviderMessagesPage() {
  const profile = await requireRole(['provider', 'staff', 'admin']);
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('patient:profiles!appointments_patient_id_fkey(id, full_name)')
    .eq('provider_id', profile.id);

  const seen = new Set<string>();
  const patients = (appointments ?? [])
    .map((a) => (Array.isArray(a.patient) ? a.patient[0] : a.patient))
    .filter((p): p is { id: string; full_name: string } => {
      if (!p || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Messages</h1>
      <div className="mt-8">
        <Messenger currentUserId={profile.id} recipients={patients} defaultContext="clinical" />
      </div>
    </div>
  );
}
