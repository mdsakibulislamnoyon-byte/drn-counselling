import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { StatCard } from '@/components/dashboard/stat-card';
import { FadeIn, StaggerGroup, StaggerItem } from '@/components/motion/fade-in';
import {
  IconUsers,
  IconBook,
  IconTrendingUp,
  IconCalendar,
  IconDollar,
  IconActivity,
} from '@/components/dashboard/dashboard-icons';

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

  const [patients, students, activeEnrollments, totalAppointments, pendingRequests, monthPayments] =
    await Promise.all([
      count(supabase, 'profiles', { role: 'patient' }),
      count(supabase, 'profiles', { role: 'student' }),
      count(supabase, 'enrollments', { status: 'active' }),
      count(supabase, 'appointments'),
      count(supabase, 'appointments', { status: 'requested' }),
      supabase
        .from('payments')
        .select('amount_cents')
        .eq('status', 'succeeded')
        .gte('created_at', startOfMonth.toISOString()),
    ]);

  const revenueCents = (monthPayments.data ?? []).reduce((sum, p) => sum + p.amount_cents, 0);

  return (
    <div>
      <p className="eyebrow">Super admin</p>
      <h1 className="mt-1 font-serif text-3xl text-ink-900">Overview</h1>

      <StaggerGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.05}>
        <StaggerItem>
          <StatCard icon={IconUsers} label="Patients" value={patients} tone="brand" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={IconBook} label="Students" value={students} tone="yellow" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={IconTrendingUp} label="Active enrollments" value={activeEnrollments} tone="blue" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={IconCalendar} label="Total appointments" value={totalAppointments} tone="mint" />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon={IconCalendar}
            label="Pending requests"
            value={pendingRequests}
            tone="coral"
            sublabel={pendingRequests > 0 ? 'Needs provider confirmation' : undefined}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={IconDollar} label="Revenue this month" value={`$${(revenueCents / 100).toFixed(2)}`} tone="brand" />
        </StaggerItem>
      </StaggerGroup>

      <FadeIn delay={0.1} className="mt-4">
        <div className="stat-card">
          <div className="icon-badge bg-mint/40 text-brand-800">
            <IconActivity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-ink-700">System health</p>
            <p className="mt-0.5 flex items-center gap-2 font-serif text-lg text-ink-900">
              <span className="h-2 w-2 rounded-full bg-brand-500" /> All systems operational
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
