import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-serif text-3xl text-ink-900">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-700">Log in to your patient, student, or staff account.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
