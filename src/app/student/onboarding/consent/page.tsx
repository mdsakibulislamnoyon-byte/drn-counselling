import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { HipaaConsentForm } from '@/components/consent/hipaa-consent-form';
import type { ConsentDocument } from '@/types/database';

export const metadata = { title: 'HIPAA Consent' };

export default async function StudentConsentOnboardingPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from('consent_documents')
    .select('*')
    .eq('is_current', true)
    .returns<ConsentDocument[]>();

  if (!documents || documents.length === 0) {
    redirect('/student');
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-serif text-3xl text-ink-900">Before we continue</h1>
      <p className="mt-2 text-sm text-ink-700">
        Please review and digitally sign the following before accessing the student portal.
      </p>
      <div className="mt-8">
        <HipaaConsentForm documents={documents} redirectTo="/student" />
      </div>
    </div>
  );
}
