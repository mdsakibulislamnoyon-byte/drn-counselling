import { requireRole } from '@/lib/auth';
import { ContactInfoForm, InsuranceForm, EmergencyContactsForm } from '@/components/portal/profile-forms';

export default async function PatientProfilePage() {
  const profile = await requireRole(['patient']);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Profile</h1>
      <div className="mt-8 grid gap-6">
        <div className="card">
          <h2 className="font-serif text-lg text-ink-900">Contact information</h2>
          <div className="mt-4"><ContactInfoForm profile={profile} /></div>
        </div>
        <div className="card">
          <h2 className="font-serif text-lg text-ink-900">Insurance details</h2>
          <div className="mt-4"><InsuranceForm /></div>
        </div>
        <div className="card">
          <h2 className="font-serif text-lg text-ink-900">Emergency contacts</h2>
          <div className="mt-4"><EmergencyContactsForm /></div>
        </div>
      </div>
    </div>
  );
}
