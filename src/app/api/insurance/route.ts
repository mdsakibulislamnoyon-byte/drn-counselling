import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { encryptFieldToPgHex, decryptFieldFromPgHex } from '@/lib/encryption';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { data, error } = await supabase
    .from('insurance_info')
    .select('*')
    .eq('patient_id', user.id)
    .eq('is_primary', true)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Unable to load insurance info.' }, { status: 500 });
  if (!data) return NextResponse.json({ insurance: null });

  await logAudit({ actorId: user.id, action: 'view', entityType: 'insurance_info', entityId: data.id });

  return NextResponse.json({
    insurance: {
      id: data.id,
      providerName: decryptFieldFromPgHex(data.provider_name_encrypted as string),
      policyNumber: decryptFieldFromPgHex(data.policy_number_encrypted as string),
      groupNumber: data.group_number_encrypted
        ? decryptFieldFromPgHex(data.group_number_encrypted as string)
        : null,
      subscriberName: decryptFieldFromPgHex(data.subscriber_name_encrypted as string),
    },
  });
}

const schema = z.object({
  providerName: z.string().trim().min(1),
  policyNumber: z.string().trim().min(1),
  groupNumber: z.string().trim().optional(),
  subscriberName: z.string().trim().min(1),
});

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { providerName, policyNumber, groupNumber, subscriberName } = parsed.data;

  const { data: existing } = await supabase
    .from('insurance_info')
    .select('id')
    .eq('patient_id', user.id)
    .eq('is_primary', true)
    .maybeSingle();

  const payload = {
    patient_id: user.id,
    provider_name_encrypted: encryptFieldToPgHex(providerName),
    policy_number_encrypted: encryptFieldToPgHex(policyNumber),
    group_number_encrypted: groupNumber ? encryptFieldToPgHex(groupNumber) : null,
    subscriber_name_encrypted: encryptFieldToPgHex(subscriberName),
    is_primary: true,
  };

  const { error } = existing
    ? await supabase.from('insurance_info').update(payload).eq('id', existing.id)
    : await supabase.from('insurance_info').insert(payload);

  if (error) return NextResponse.json({ error: 'Unable to save insurance info.' }, { status: 500 });

  await logAudit({ actorId: user.id, action: existing ? 'update' : 'create', entityType: 'insurance_info' });

  return NextResponse.json({ success: true });
}
