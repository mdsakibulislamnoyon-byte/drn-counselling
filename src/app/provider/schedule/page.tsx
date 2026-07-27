import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { AppointmentActions } from './appointment-actions';

export default async function ProviderSchedulePage() {
  const profile = await requireRole(['provider', 'staff', 'admin']);
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, patient:profiles!appointments_patient_id_fkey(full_name)')
    .eq('provider_id', profile.id)
    .order('start_time', { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Schedule</h1>
      <div className="mt-8 space-y-3">
        {!appointments || appointments.length === 0 ? (
          <p className="text-sm text-ink-700">No appointments yet.</p>
        ) : (
          appointments.map((appt) => (
            <div key={appt.id} className="card flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink-900">
                  {(appt as unknown as { patient: { full_name: string } }).patient?.full_name}
                </p>
                <p className="text-xs text-ink-700">
                  {format(new Date(appt.start_time), 'EEE, MMM d · h:mm a')} ·{' '}
                  <span className="capitalize">{appt.type.replace('_', ' ')}</span>
                </p>
                <span className="badge mt-1 bg-ink-100 capitalize text-ink-700">{appt.status}</span>
              </div>
              <AppointmentActions appointmentId={appt.id} status={appt.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
