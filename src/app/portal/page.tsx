import Link from 'next/link';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { Appointment } from '@/types/database';

export default async function PatientDashboardPage() {
  const profile = await requireRole(['patient']);
  const supabase = await createClient();

  const { data: upcoming } = await supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', profile.id)
    .gte('start_time', new Date().toISOString())
    .in('status', ['requested', 'confirmed'])
    .order('start_time')
    .limit(3)
    .returns<Appointment[]>();

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Welcome back, {profile.full_name.split(' ')[0]}</h1>
      <p className="mt-1 text-ink-700">Here&apos;s what&apos;s next.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-ink-900">Upcoming appointments</h2>
            <Link href="/portal/appointments" className="text-sm text-brand-700 underline">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {!upcoming || upcoming.length === 0 ? (
              <p className="text-sm text-ink-700">No upcoming appointments.</p>
            ) : (
              upcoming.map((appt) => (
                <div key={appt.id} className="rounded-xl bg-ink-50 p-3">
                  <p className="text-sm font-medium text-ink-900">
                    {format(new Date(appt.start_time), 'EEE, MMM d · h:mm a')}
                  </p>
                  <p className="text-xs capitalize text-ink-700">
                    {appt.type.replace('_', ' ')} · {appt.status}
                  </p>
                </div>
              ))
            )}
          </div>
          <Link href="/portal/appointments" className="btn-secondary mt-4 w-full">
            Request an appointment
          </Link>
        </div>

        <div className="card">
          <h2 className="font-serif text-lg text-ink-900">Messages</h2>
          <p className="mt-2 text-sm text-ink-700">
            Send a secure, encrypted message to Dominik or your care team.
          </p>
          <Link href="/portal/messages" className="btn-primary mt-4 w-full">
            Open messages
          </Link>
        </div>
      </div>
    </div>
  );
}
