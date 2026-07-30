import Link from 'next/link';
import { format, formatDistanceToNow, startOfWeek, endOfWeek } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { StatCard } from '@/components/dashboard/stat-card';
import { OpsPanel, type OpsCheck } from '@/components/dashboard/ops-panel';
import { FadeIn, StaggerGroup, StaggerItem } from '@/components/motion/fade-in';
import {
  IconUsers,
  IconCalendar,
  IconBook,
  IconDollar,
} from '@/components/dashboard/dashboard-icons';

async function count(supabase: Awaited<ReturnType<typeof createClient>>, table: string, filter?: Record<string, unknown>) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) {
    for (const [key, value] of Object.entries(filter)) query = query.eq(key, value);
  }
  const { count } = await query;
  return count ?? 0;
}

interface ActivityItem {
  type: 'enrollment' | 'certificate' | 'care_request';
  label: string;
  detail: string;
  at: string;
}

export default async function AdminOverviewPage() {
  const profile = await requireRole(['admin']);
  const supabase = await createClient();

  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());

  const [
    totalUsers,
    publishedCourses,
    weekAppointments,
    weekConfirmed,
    revenuePayments,
    recentEnrollments,
    recentCertificates,
    recentCareRequests,
    currentConsent,
  ] = await Promise.all([
    count(supabase, 'profiles'),
    count(supabase, 'courses', { is_published: true }),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('start_time', weekStart.toISOString())
      .lte('start_time', weekEnd.toISOString()),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('start_time', weekStart.toISOString())
      .lte('start_time', weekEnd.toISOString())
      .in('status', ['confirmed', 'completed']),
    supabase
      .from('payments')
      .select('amount_cents')
      .eq('status', 'succeeded')
      .in('type', ['course_purchase', 'course_installment']),
    supabase
      .from('enrollments')
      .select('enrolled_at, profiles!enrollments_student_id_fkey(full_name), courses(title)')
      .order('enrolled_at', { ascending: false })
      .limit(3),
    supabase
      .from('certificates')
      .select('issued_at, enrollments(profiles!enrollments_student_id_fkey(full_name), courses(title))')
      .order('issued_at', { ascending: false })
      .limit(3),
    supabase
      .from('appointments')
      .select('created_at, profiles!appointments_patient_id_fkey(full_name)')
      .eq('status', 'requested')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase.from('consent_documents').select('id', { count: 'exact', head: true }).eq('is_current', true),
  ]);

  const weekTotal = weekAppointments.count ?? 0;
  const weekConfirmedCount = weekConfirmed.count ?? 0;
  const confirmedPct = weekTotal > 0 ? Math.round((weekConfirmedCount / weekTotal) * 100) : null;
  const revenueCents = (revenuePayments.data ?? []).reduce((sum, p) => sum + p.amount_cents, 0);

  const activity: ActivityItem[] = [
    ...(recentEnrollments.data ?? []).map((e) => {
      const r = e as unknown as { enrolled_at: string; profiles: { full_name: string }; courses: { title: string } };
      return {
        type: 'enrollment' as const,
        label: 'New student enrollment',
        detail: `${r.profiles?.full_name} enrolled in ${r.courses?.title}`,
        at: r.enrolled_at,
      };
    }),
    ...(recentCertificates.data ?? []).map((c) => {
      const r = c as unknown as {
        issued_at: string;
        enrollments: { profiles: { full_name: string }; courses: { title: string } };
      };
      return {
        type: 'certificate' as const,
        label: 'Course completed',
        detail: `${r.enrollments?.profiles?.full_name} earned a certificate for ${r.enrollments?.courses?.title}`,
        at: r.issued_at,
      };
    }),
    ...(recentCareRequests.data ?? []).map((a) => {
      const r = a as unknown as { created_at: string; profiles: { full_name: string } };
      return {
        type: 'care_request' as const,
        label: 'New appointment request',
        detail: `${r.profiles?.full_name} requested an appointment`,
        at: r.created_at,
      };
    }),
  ]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 5);

  const opsChecks: OpsCheck[] = [
    {
      label: 'HIPAA consent document published',
      ok: (currentConsent.count ?? 0) > 0,
      detail: (currentConsent.count ?? 0) > 0 ? 'Patients can complete onboarding.' : 'No current consent document — signups are blocked.',
    },
    {
      label: 'Stripe payments configured',
      ok: !!process.env.STRIPE_SECRET_KEY,
      detail: process.env.STRIPE_SECRET_KEY ? 'Checkout is live.' : 'Add STRIPE_SECRET_KEY to enable checkout.',
    },
    {
      label: 'Field encryption configured',
      ok: !!process.env.FIELD_ENCRYPTION_KEY,
      detail: process.env.FIELD_ENCRYPTION_KEY ? 'Insurance/messages/notes are encrypted.' : 'Missing FIELD_ENCRYPTION_KEY.',
    },
    {
      label: 'Transactional email configured',
      ok: !!process.env.RESEND_API_KEY,
      detail: process.env.RESEND_API_KEY ? 'Reminders/receipts can send.' : 'Add RESEND_API_KEY to send real emails.',
    },
  ];

  return (
    <div>
      <p className="eyebrow">Platform overview</p>
      <h1 className="mt-1 font-serif text-3xl text-ink-900">Good afternoon, {profile.full_name.split(' ')[0]}.</h1>
      <p className="mt-1 text-ink-700">Here&apos;s what&apos;s happening across the platform.</p>

      <StaggerGroup className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.05}>
        <StaggerItem>
          <StatCard icon={IconUsers} label="Total users" value={totalUsers} tone="brand" />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon={IconCalendar}
            label="Appointments this week"
            value={weekTotal}
            tone="blue"
            sublabel={confirmedPct !== null ? `${confirmedPct}% confirmed` : undefined}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={IconBook} label="Published courses" value={publishedCourses} tone="yellow" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={IconDollar} label="Course revenue" value={`$${(revenueCents / 100).toFixed(2)}`} tone="coral" />
        </StaggerItem>
      </StaggerGroup>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FadeIn className="card">
          <p className="eyebrow">User management</p>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-ink-900">Recent activity</h2>
            <Link href="/admin/students" className="text-sm text-brand-700 underline">
              Manage users
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {activity.length === 0 ? (
              <p className="text-sm text-ink-700">No recent activity yet.</p>
            ) : (
              activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <div>
                    <p className="font-medium text-ink-900">{item.label}</p>
                    <p className="text-xs text-ink-700">
                      {item.detail} · {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </FadeIn>

        <FadeIn delay={0.1} className="card">
          <p className="eyebrow">Platform health</p>
          <h2 className="font-serif text-lg text-ink-900">Operational checklist</h2>
          <div className="mt-2">
            <OpsPanel checks={opsChecks} />
          </div>
        </FadeIn>
      </div>

      <FadeIn delay={0.15} className="card mt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Content management</p>
            <h2 className="font-serif text-lg text-ink-900">Keep the academy current</h2>
          </div>
          <Link href="/admin/courses" className="btn-primary">
            Manage courses
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
