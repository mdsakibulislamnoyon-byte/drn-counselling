import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { encryptFieldToPgHex, decryptFieldFromPgHex } from '@/lib/encryption';
import { logAudit } from '@/lib/audit';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Returns the decrypted clinical note for an appointment. Explicitly
 * restricted to provider/staff/admin: RLS's appointments_patient_select
 * policy lets a patient SELECT their own appointment row (including this
 * encrypted column), so relying on RLS alone here would let a patient
 * decrypt their own provider's private clinical note through this route.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { data: requester } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!requester || !['provider', 'staff', 'admin'].includes(requester.role)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('provider_notes_encrypted')
    .eq('id', id)
    .maybeSingle();

  if (error || !appointment) return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });

  await logAudit({ actorId: user.id, action: 'view', entityType: 'appointment_note', entityId: id });

  return NextResponse.json({
    note: appointment.provider_notes_encrypted
      ? decryptFieldFromPgHex(appointment.provider_notes_encrypted as string)
      : null,
  });
}

const schema = z.object({ note: z.string().trim().min(1).max(10000) });

/** Saves a clinical note. RLS (appointments_provider_manage) ensures only the assigned provider can write it. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { data: requester } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!requester || !['provider', 'staff', 'admin'].includes(requester.role)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Note cannot be empty.' }, { status: 400 });

  const { error } = await supabase
    .from('appointments')
    .update({ provider_notes_encrypted: encryptFieldToPgHex(parsed.data.note) })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Unable to save note.' }, { status: 500 });

  await logAudit({ actorId: user.id, action: 'update', entityType: 'appointment_note', entityId: id });

  return NextResponse.json({ success: true });
}
