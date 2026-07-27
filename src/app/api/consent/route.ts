import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

const bodySchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1),
  signatureFullName: z.string().trim().min(2),
});

function getClientIp(request: NextRequest): string | null {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

/**
 * Records a patient/student's e-signature against one or more current
 * consent_documents (HIPAA acknowledgment, privacy consent, telehealth
 * consent). Snapshots the exact legal text at signing time and stamps
 * IP/user-agent for the compliance audit trail.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const { documentIds, signatureFullName } = parsed.data;

  const { data: documents, error: docsError } = await supabase
    .from('consent_documents')
    .select('id, body_md')
    .in('id', documentIds)
    .eq('is_current', true);

  if (docsError || !documents || documents.length !== documentIds.length) {
    return NextResponse.json({ error: 'One or more consent documents were not found.' }, { status: 404 });
  }

  const ipAddress = getClientIp(request);
  const userAgent = request.headers.get('user-agent');
  const signedAt = new Date().toISOString();

  const rows = documents.map((doc) => ({
    user_id: user.id,
    consent_document_id: doc.id,
    body_md_snapshot: doc.body_md,
    signature_full_name: signatureFullName,
    signed_at: signedAt,
    ip_address: ipAddress,
    user_agent: userAgent,
  }));

  const { error: insertError } = await supabase.from('hipaa_consents').insert(rows);

  if (insertError) {
    return NextResponse.json({ error: 'Unable to record consent.' }, { status: 500 });
  }

  await Promise.all(
    documents.map((doc) =>
      logAudit({
        actorId: user.id,
        action: 'create',
        entityType: 'hipaa_consent',
        entityId: doc.id,
        ipAddress,
        userAgent,
      })
    )
  );

  return NextResponse.json({ success: true });
}
