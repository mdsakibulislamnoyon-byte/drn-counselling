import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

const requestSchema = z.object({
  providerId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.enum(['initial_consult', 'individual_session', 'family_session', 'telehealth', 'in_person']),
  patientNotes: z.string().trim().max(2000).optional(),
});

/** Patient-initiated appointment request. Always lands as status='requested'; a
 *  provider/staff member confirms it via PATCH /api/appointments/[id]. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { providerId, startTime, endTime, type, patientNotes } = parsed.data;

  if (new Date(endTime) <= new Date(startTime)) {
    return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 });
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      patient_id: user.id,
      provider_id: providerId,
      start_time: startTime,
      end_time: endTime,
      type,
      patient_notes: patientNotes ?? null,
      status: 'requested',
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: 'Unable to request appointment.' }, { status: 500 });

  await supabase.from('notifications').insert({
    user_id: providerId,
    type: 'appointment_requested',
    title: 'New appointment request',
    body: `A new appointment request needs your confirmation.`,
    link_url: '/provider/schedule',
  });

  await logAudit({ actorId: user.id, action: 'create', entityType: 'appointment', entityId: appointment.id });

  return NextResponse.json({ id: appointment.id }, { status: 201 });
}
