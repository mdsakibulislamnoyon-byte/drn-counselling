import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

interface Params {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  cancellationReason: z.string().trim().max(500).optional(),
});

/**
 * Updates an appointment's status/time. RLS restricts who can actually
 * perform each change: patients may only cancel their own; providers may
 * only update their own; staff/admin with appointments.manage_all can do
 * anything (see migration 012).
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { status, startTime, endTime, cancellationReason } = parsed.data;

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (startTime) updates.start_time = startTime;
  if (endTime) updates.end_time = endTime;
  if (status === 'cancelled') {
    updates.cancelled_by = user.id;
    updates.cancellation_reason = cancellationReason ?? null;
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select('id, patient_id, provider_id')
    .single();

  if (error || !appointment) {
    return NextResponse.json({ error: 'Unable to update appointment.' }, { status: 403 });
  }

  if (status) {
    await supabase.from('notifications').insert({
      user_id: appointment.patient_id === user.id ? appointment.provider_id : appointment.patient_id,
      type: 'appointment_updated',
      title: `Appointment ${status}`,
      body: `Your appointment status changed to ${status}.`,
      link_url: '/portal/appointments',
    });
  }

  await logAudit({ actorId: user.id, action: 'update', entityType: 'appointment', entityId: id });

  return NextResponse.json({ success: true });
}
