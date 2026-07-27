import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export default async function ProviderPatientsPage() {
  const profile = await requireRole(['provider', 'staff', 'admin']);
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('patient:profiles!appointments_patient_id_fkey(id, full_name, email)')
    .eq('provider_id', profile.id);

  const seen = new Set<string>();
  const patients = (appointments ?? [])
    .map((a) => (Array.isArray(a.patient) ? a.patient[0] : a.patient))
    .filter((p): p is { id: string; full_name: string; email: string } => {
      if (!p || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Patients</h1>
      <div className="mt-8 space-y-3">
        {patients.length === 0 ? (
          <p className="text-sm text-ink-700">No patients yet.</p>
        ) : (
          patients.map((p) => (
            <Link key={p.id} href={`/provider/patients/${p.id}`} className="card flex items-center justify-between hover:shadow-md">
              <div>
                <p className="text-sm font-medium text-ink-900">{p.full_name}</p>
                <p className="text-xs text-ink-700">{p.email}</p>
              </div>
              <span className="text-sm text-brand-700">View chart →</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
