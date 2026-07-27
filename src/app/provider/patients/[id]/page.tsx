import { format } from 'date-fns';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { decryptFieldFromPgHex } from '@/lib/encryption';
import { logAudit } from '@/lib/audit';
import type { Appointment, HipaaConsent, Profile } from '@/types/database';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientChartPage({ params }: PageProps) {
  const { id } = await params;
  const provider = await requireRole(['provider', 'staff', 'admin']);
  const supabase = await createClient();

  const { data: patient } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle<Profile>();

  if (!patient) notFound();

  const [canViewConsents, canViewInsurance] = await Promise.all([
    hasPermission('consents.view'),
    hasPermission('billing.view_insurance'),
  ]);

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', id)
    .eq('provider_id', provider.id)
    .order('start_time', { ascending: false })
    .returns<Appointment[]>();

  const consents = canViewConsents
    ? (
        await supabase
          .from('hipaa_consents')
          .select('*, consent_documents(title, version)')
          .eq('user_id', id)
          .is('revoked_at', null)
      ).data
    : null;

  const insurance = canViewInsurance
    ? (
        await supabase
          .from('insurance_info')
          .select('*')
          .eq('patient_id', id)
          .eq('is_primary', true)
          .maybeSingle()
      ).data
    : null;

  if (canViewConsents || canViewInsurance) {
    await logAudit({ actorId: provider.id, action: 'view', entityType: 'patient_chart', entityId: id });
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">{patient.full_name}</h1>
      <p className="text-sm text-ink-700">{patient.email} · {patient.phone ?? 'No phone on file'}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="font-serif text-lg text-ink-900">Appointment history</h2>
          <div className="mt-3 space-y-2">
            {!appointments || appointments.length === 0 ? (
              <p className="text-sm text-ink-700">No appointments with this patient yet.</p>
            ) : (
              appointments.map((a) => (
                <div key={a.id} className="rounded-xl bg-ink-50 p-3 text-sm">
                  <p className="font-medium text-ink-900">{format(new Date(a.start_time), 'MMM d, yyyy · h:mm a')}</p>
                  <p className="text-xs capitalize text-ink-700">{a.type.replace('_', ' ')} · {a.status}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="font-serif text-lg text-ink-900">HIPAA consent status</h2>
          {!canViewConsents ? (
            <p className="mt-2 text-sm text-ink-700">You don&apos;t have permission to view consent records.</p>
          ) : !consents || consents.length === 0 ? (
            <p className="mt-2 text-sm text-red-600">No signed consent on file.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {(consents as unknown as (HipaaConsent & { consent_documents: { title: string; version: string } })[]).map((c) => (
                <div key={c.id} className="rounded-xl bg-brand-50 p-3 text-sm">
                  <p className="font-medium text-ink-900">{c.consent_documents?.title} (v{c.consent_documents?.version})</p>
                  <p className="text-xs text-ink-700">
                    Signed {format(new Date(c.signed_at), 'MMM d, yyyy · h:mm a')} by &quot;{c.signature_full_name}&quot;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card md:col-span-2">
          <h2 className="font-serif text-lg text-ink-900">Insurance</h2>
          {!canViewInsurance ? (
            <p className="mt-2 text-sm text-ink-700">You don&apos;t have permission to view insurance details.</p>
          ) : !insurance ? (
            <p className="mt-2 text-sm text-ink-700">No insurance information on file.</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <p><span className="text-ink-700">Provider:</span> {decryptFieldFromPgHex(insurance.provider_name_encrypted as string)}</p>
              <p><span className="text-ink-700">Policy #:</span> {decryptFieldFromPgHex(insurance.policy_number_encrypted as string)}</p>
              <p><span className="text-ink-700">Subscriber:</span> {decryptFieldFromPgHex(insurance.subscriber_name_encrypted as string)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
