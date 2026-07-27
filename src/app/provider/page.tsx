import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { Appointment } from '@/types/database';

export default async function ProviderDashboardPage() {
  const profile = await requireRole(['provider', 'staff', 'admin']);
  const supabase = await createClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [{ data: today }, { data: pending }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, patient:profiles!appointments_patient_id_fkey(full_name)')
      .eq('provider_id', profile.id)
      .gte('start_time', startOfToday.toISOString())
      .lte('start_time', endOfToday.toISOString())
      .order('start_time'),
    supabase
      .from('appointments')
      .select('id')
      .eq('provider_id', profile.id)
      .eq('status', 'requested'),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Good day, {profile.full_name.split(' ')[0]}</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="font-serif text-lg text-ink-900">Today&apos;s schedule</h2>
          <div className="mt-4 space-y-3">
            {!today || today.length === 0 ? (
              <p className="text-sm text-ink-700">No appointments today.</p>
            ) : (
              (today as unknown as (Appointment & { patient: { full_name: string } })[]).map((appt) => (
                <div key={appt.id} className="flex items-center justify-between rounded-xl bg-ink-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{appt.patient?.full_name}</p>
                    <p className="text-xs text-ink-700">{format(new Date(appt.start_time), 'h:mm a')}</p>
                  </div>
                  <span className="badge bg-brand-50 capitalize text-brand-700">{appt.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="font-serif text-lg text-ink-900">Pending requests</h2>
          <p className="mt-2 text-3xl font-semibold text-brand-700">{pending?.length ?? 0}</p>
          <p className="mt-1 text-sm text-ink-700">Appointment requests awaiting your confirmation.</p>
          <a href="/provider/schedule" className="btn-primary mt-4 w-full">Review schedule</a>
        </div>
      </div>
    </div>
  );
}
