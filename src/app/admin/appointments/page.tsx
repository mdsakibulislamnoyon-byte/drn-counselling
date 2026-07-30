import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { StatusPill } from '@/components/dashboard/status-pill';

export default async function AdminAppointmentsPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from('appointments')
    .select(
      '*, patient:profiles!appointments_patient_id_fkey(full_name), provider:profiles!appointments_provider_id_fkey(full_name)'
    )
    .order('start_time', { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">All appointments</h1>

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink-100">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-700">
            <tr>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(appointments ?? []).map((a) => {
              const patient = (a as unknown as { patient: { full_name: string } }).patient;
              const provider = (a as unknown as { provider: { full_name: string } }).provider;
              return (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{patient?.full_name}</td>
                  <td className="px-4 py-3 text-ink-700">{provider?.full_name}</td>
                  <td className="px-4 py-3 text-ink-700">{format(new Date(a.start_time), 'MMM d, yyyy · h:mm a')}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={a.status} />
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
