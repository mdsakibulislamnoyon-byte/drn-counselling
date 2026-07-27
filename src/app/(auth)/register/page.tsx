import type { Metadata } from 'next';
import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Create your account' };

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-serif text-3xl text-ink-900">Create your account</h1>
      <p className="mt-2 text-sm text-ink-700">
        After you sign up, you&apos;ll be asked to review and digitally sign our HIPAA Acknowledgment
        and Privacy Consent form before your portal unlocks.
      </p>
      <RegisterForm />
    </div>
  );
}
