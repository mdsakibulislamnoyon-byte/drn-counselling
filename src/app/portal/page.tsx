import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { Appointment } from '@/types/database';
import { StatusPill } from '@/components/dashboard/status-pill';
import { FadeIn } from '@/components/motion/fade-in';
import { WellnessCheckin } from '@/components/portal/wellness-checkin';
import { decryptFieldFromPgHex } from '@/lib/encryption';

export default async function PatientDashboardPage() {
  const profile = await requireRole(['patient']);
  const supabase = await createClient();

  const [{ data: upcoming }, { data: participantRows }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', profile.id)
      .gte('start_time', new Date().toISOString())
      .in('status', ['requested', 'confirmed'])
      .order('start_time')
      .limit(3)
      .returns<Appointment[]>(),
    supabase.from('conversation_participants').select('conversation_id').eq('user_id', profile.id),
  ]);

  let latestMessage: { senderName: string; body: string; createdAt: string } | null = null;
  const conversationIds = (participantRows ?? []).map((r) => r.conversation_id);
  if (conversationIds.length > 0) {
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('body_encrypted, created_at, sender:profiles!messages_sender_id_fkey(full_name)')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
      .limit(1);

    const msg = recentMessages?.[0];
    if (msg) {
      const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
      latestMessage = {
        senderName: sender?.full_name ?? 'Care team',
        body: decryptFieldFromPgHex(msg.body_encrypted as string),
        createdAt: msg.created_at,
      };
    }
  }

  return (
    <div>
      <p className="eyebrow">Patient portal</p>
      <h1 className="mt-1 font-serif text-3xl text-ink-900">Welcome back, {profile.full_name.split(' ')[0]}</h1>
      <p className="mt-1 text-ink-700">Here&apos;s what&apos;s next.</p>

      <FadeIn className="card mt-8">
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
              <div key={appt.id} className="flex items-center justify-between rounded-xl bg-paper-deep p-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {format(new Date(appt.start_time), 'EEE, MMM d · h:mm a')}
                  </p>
                  <p className="text-xs capitalize text-ink-700">{appt.type.replace('_', ' ')}</p>
                </div>
                <StatusPill status={appt.status} />
              </div>
            ))
          )}
        </div>
        <Link href="/portal/appointments" className="btn-secondary mt-4 w-full">
          Request an appointment
        </Link>
      </FadeIn>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <FadeIn>
          <WellnessCheckin />
        </FadeIn>

        <FadeIn delay={0.1} className="card">
          <p className="eyebrow">Secure messages</p>
          <h2 className="font-serif text-lg text-ink-900">Recent messages</h2>
          {latestMessage ? (
            <div className="mt-3 flex items-start gap-3 rounded-xl bg-cream p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
                {latestMessage.senderName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-ink-900">{latestMessage.senderName}</span>{' '}
                  <span className="text-xs text-ink-700">
                    {formatDistanceToNow(new Date(latestMessage.createdAt), { addSuffix: true })}
                  </span>
                </p>
                <p className="truncate text-sm text-ink-700">{latestMessage.body}</p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-700">
              Send a secure, encrypted message to Dominick or your care team.
            </p>
          )}
          <Link href="/portal/messages" className="btn-primary mt-4 w-full">
            Open messages
          </Link>
        </FadeIn>
      </div>
    </div>
  );
}
