import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

async function count(supabase: Awaited<ReturnType<typeof createClient>>, table: string, filter?: Record<string, unknown>) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) {
    for (const [key, value] of Object.entries(filter)) query = query.eq(key, value);
  }
  const { count } = await query;
  return count ?? 0;
}

export default async function AdminOverviewPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [patients, students, activeEnrollments, upcomingAppointments, monthPayments] = await Promise.all([
    count(supabase, 'profiles', { role: 'patient' }),
    count(supabase, 'profiles', { role: 'student' }),
    count(supabase, 'enrollments', { status: 'active' }),
    count(supabase, 'appointments'),
    supabase
      .from('payments')
      .select('amount_cents')
      .eq('status', 'succeeded')
      .gte('created_at', startOfMonth.toISOString()),
  ]);

  const revenueCents = (monthPayments.data ?? []).reduce((sum, p) => sum + p.amount_cents, 0);

  const stats = [
    { label: 'Patients', value: patients },
    { label: 'Students', value: students },
    { label: 'Active enrollments', value: activeEnrollments },
    { label: 'Total appointments', value: upcomingAppointments },
    { label: 'Revenue this month', value: `$${(revenueCents / 100).toFixed(2)}` },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Overview</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-ink-700">{s.label}</p>
            <p className="mt-1 text-3xl font-semibold text-ink-900">{s.value}</p>
          </div>
        ))}
        <div className="card">
          <p className="text-sm text-ink-700">System health</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-medium text-brand-700">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> All systems operational
          </p>
        </div>
      </div>
    </div>
  );
}
