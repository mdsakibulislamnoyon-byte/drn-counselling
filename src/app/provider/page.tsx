import { format, formatDistanceToNow, subMonths, startOfMonth } from 'date-fns';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { Appointment } from '@/types/database';
import { StatusPill } from '@/components/dashboard/status-pill';
import { StatCard } from '@/components/dashboard/stat-card';
import { BarChart } from '@/components/dashboard/bar-chart';
import { FadeIn, StaggerGroup, StaggerItem } from '@/components/motion/fade-in';
import { IconCalendar, IconUsers, IconChat, IconBook } from '@/components/dashboard/dashboard-icons';
import { SessionNoteButton } from '@/components/provider/session-note-button';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default async function ProviderDashboardPage() {
  const profile = await requireRole(['provider', 'staff', 'admin']);
  const supabase = await createClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [
    { data: today },
    { data: allAppointments },
    { data: needsNotes },
    { data: participantRows },
    { data: activeEnrollments },
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, patient:profiles!appointments_patient_id_fkey(full_name)')
      .eq('provider_id', profile.id)
      .gte('start_time', startOfToday.toISOString())
      .lte('start_time', endOfToday.toISOString())
      .order('start_time'),
    supabase.from('appointments').select('patient_id, status').eq('provider_id', profile.id),
    supabase
      .from('appointments')
      .select('id, start_time, patient:profiles!appointments_patient_id_fkey(full_name)')
      .eq('provider_id', profile.id)
      .eq('status', 'completed')
      .is('provider_notes_encrypted', null)
      .order('start_time', { ascending: false })
      .limit(4),
    supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at, conversations(subject, last_message_at)')
      .eq('user_id', profile.id),
    supabase.from('enrollments').select('enrolled_at').eq('status', 'active'),
  ]);

  const activeClients = new Set((allAppointments ?? []).map((a) => a.patient_id)).size;
  const pendingCount = (allAppointments ?? []).filter((a) => a.status === 'requested').length;

  const unreadConversations = (participantRows ?? [])
    .map((p) => {
      const conv = Array.isArray(p.conversations) ? p.conversations[0] : p.conversations;
      return { conversationId: p.conversation_id, subject: conv?.subject, lastMessageAt: conv?.last_message_at, lastReadAt: p.last_read_at };
    })
    .filter((c) => c.lastMessageAt && (!c.lastReadAt || new Date(c.lastMessageAt) > new Date(c.lastReadAt)));

  // Real, cheap "course performance" signal: active enrollments grouped by
  // enrollment month for the last 6 months — no fabricated numbers.
  const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)));
  const chartData = months.map((monthStart) => {
    const monthEnd = startOfMonth(subMonths(monthStart, -1));
    const value = (activeEnrollments ?? []).filter((e) => {
      const d = new Date(e.enrolled_at);
      return d >= monthStart && d < monthEnd;
    }).length;
    return { label: format(monthStart, 'MMM'), value };
  });

  return (
    <div>
      <p className="eyebrow">Provider dashboard</p>
      <h1 className="mt-1 font-serif text-3xl text-ink-900">Good day, {profile.full_name.split(' ')[0]}</h1>

      <StaggerGroup className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.05}>
        <StaggerItem>
          <StatCard icon={IconCalendar} label="Sessions today" value={today?.length ?? 0} tone="blue" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={IconUsers} label="Active clients" value={activeClients} tone="brand" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={IconChat} label="Unread conversations" value={unreadConversations.length} tone="coral" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={IconBook} label="Course learners" value={activeEnrollments?.length ?? 0} tone="yellow" />
        </StaggerItem>
      </StaggerGroup>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FadeIn className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Today&apos;s schedule</p>
              <h2 className="font-serif text-lg text-ink-900">{format(new Date(), 'EEEE, MMMM d')}</h2>
            </div>
            <Link href="/provider/schedule" className="text-sm text-brand-700 underline">
              Open calendar
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {!today || today.length === 0 ? (
              <p className="text-sm text-ink-700">No appointments today.</p>
            ) : (
              (today as unknown as (Appointment & { patient: { full_name: string } })[]).map((appt) => (
                <div key={appt.id} className="rounded-xl bg-paper-deep p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink-900">
                        {format(new Date(appt.start_time), 'h:mm a')} · {appt.patient?.full_name}
                      </p>
                      <p className="text-xs capitalize text-ink-700">{appt.type.replace('_', ' ')}</p>
                    </div>
                    <StatusPill status={appt.status} />
                  </div>
                  {(appt.status === 'confirmed' || appt.status === 'completed') && (
                    <div className="mt-2">
                      <SessionNoteButton appointmentId={appt.id} hasNote={!!appt.provider_notes_encrypted} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </FadeIn>

        <FadeIn delay={0.1} className="card">
          <p className="eyebrow">Caseload</p>
          <h2 className="font-serif text-lg text-ink-900">Needs your attention</h2>
          <div className="mt-3 divide-y divide-ink-100">
            {(needsNotes ?? []).map((appt) => {
              const patient = (appt as unknown as { patient: { full_name: string } }).patient;
              return (
                <Link
                  key={appt.id}
                  href="/provider/schedule"
                  className="flex items-center gap-3 py-2.5 text-sm hover:bg-paper-deep"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral/30 text-xs font-semibold text-coral-deep">
                    {initials(patient?.full_name ?? '?')}
                  </span>
                  <span>
                    <span className="block font-medium text-ink-900">{patient?.full_name}</span>
                    <span className="text-xs text-ink-700">
                      Session note due · {format(new Date(appt.start_time), 'MMM d')}
                    </span>
                  </span>
                </Link>
              );
            })}
            {unreadConversations.slice(0, 3).map((c) => (
              <Link
                key={c.conversationId}
                href="/provider/messages"
                className="flex items-center gap-3 py-2.5 text-sm hover:bg-paper-deep"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-blue/40 text-xs font-semibold text-accent-blue-deep">
                  <IconChat className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-medium text-ink-900">{c.subject ?? 'New message'}</span>
                  <span className="text-xs text-ink-700">
                    {c.lastMessageAt && formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: true })}
                  </span>
                </span>
              </Link>
            ))}
            {(needsNotes?.length ?? 0) === 0 && unreadConversations.length === 0 && (
              <p className="py-2.5 text-sm text-ink-700">You&apos;re all caught up.</p>
            )}
          </div>
          {pendingCount > 0 && (
            <Link href="/provider/schedule" className="btn-secondary mt-3 w-full">
              {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'} to confirm
            </Link>
          )}
        </FadeIn>
      </div>

      <FadeIn delay={0.15} className="card mt-6">
        <p className="eyebrow">Course performance</p>
        <h2 className="font-serif text-lg text-ink-900">Active enrollments by month</h2>
        <div className="mt-4">
          <BarChart data={chartData} />
          <div className="mt-1 flex gap-2">
            {chartData.map((d) => (
              <span key={d.label} className="flex-1 text-center text-xs text-ink-700">
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
