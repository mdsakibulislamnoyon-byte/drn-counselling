import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { Appointment, Profile } from '@/types/database';
import { RequestAppointmentForm } from './request-appointment-form';

const STATUS_STYLES: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-brand-50 text-brand-700',
  completed: 'bg-ink-100 text-ink-700',
  cancelled: 'bg-red-50 text-red-700',
  no_show: 'bg-red-50 text-red-700',
};

export default async function PatientAppointmentsPage() {
  const profile = await requireRole(['patient']);
  const supabase = await createClient();

  const [{ data: appointments }, { data: providers }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', profile.id)
      .order('start_time', { ascending: false })
      .returns<Appointment[]>(),
    supabase.from('profiles').select('*').eq('role', 'provider').returns<Profile[]>(),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Appointments</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {!appointments || appointments.length === 0 ? (
            <p className="text-sm text-ink-700">You have no appointments yet.</p>
          ) : (
            appointments.map((appt) => (
              <div key={appt.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {format(new Date(appt.start_time), 'EEEE, MMMM d, yyyy · h:mm a')}
                  </p>
                  <p className="mt-1 text-xs capitalize text-ink-700">
                    {appt.type.replace('_', ' ')} · {appt.is_telehealth ? 'Telehealth' : 'In person'}
                  </p>
                </div>
                <span className={`badge capitalize ${STATUS_STYLES[appt.status]}`}>
                  {appt.status.replace('_', ' ')}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="card h-fit">
          <h2 className="font-serif text-lg text-ink-900">Request an appointment</h2>
          <RequestAppointmentForm providers={providers ?? []} />
        </div>
      </div>
    </div>
  );
}
