import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Services' };

const SERVICES = [
  {
    title: 'Individual Therapy',
    description: 'One-on-one sessions tailored to your goals, delivered in person or via secure telehealth.',
  },
  {
    title: 'Family & Couples Therapy',
    description: 'Structured sessions focused on communication, conflict resolution, and rebuilding trust.',
  },
  {
    title: 'Telehealth Sessions',
    description: 'HIPAA-compliant video sessions from anywhere, booked directly through your patient portal.',
  },
  {
    title: 'Clinician Training Courses',
    description: 'Self-paced professional development courses for newly graduated mental health clinicians.',
  },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-serif text-4xl text-ink-900">Services</h1>
      <p className="mt-4 max-w-2xl text-ink-700">
        Every service below is booked and managed through your secure patient portal, protected by
        encrypted messaging and a signed HIPAA consent on file.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {SERVICES.map((s) => (
          <div key={s.title} className="card">
            <h3 className="font-serif text-lg text-ink-900">{s.title}</h3>
            <p className="mt-2 text-sm text-ink-700">{s.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 card bg-brand-50">
        <p className="font-serif text-lg text-ink-900">Insurance & self-pay</p>
        <p className="mt-2 text-sm text-ink-700">
          Insurance details are collected securely in your patient profile after registration.
          Self-pay and co-pay billing is processed through Stripe.
        </p>
        <Link href="/register" className="btn-primary mt-4 inline-flex">
          Get started
        </Link>
      </div>
    </div>
  );
}
