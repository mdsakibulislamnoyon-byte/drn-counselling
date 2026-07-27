import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About Dominik Nicotera' };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl text-ink-900">About Dominik Nicotera</h1>
      <p className="mt-6 text-lg leading-relaxed text-ink-700">
        Dominik Nicotera is a licensed mental health counselor dedicated to helping individuals
        and families navigate life&apos;s transitions, challenges, and growth. With a practice built
        on evidence-based approaches and genuine human connection, Dominik works collaboratively
        with each client to build a path toward lasting well-being.
      </p>
      <p className="mt-4 leading-relaxed text-ink-700">
        Beyond the therapy room, Dominik is passionate about strengthening the next generation of
        clinicians. The Dominik Nicotera Counselling Academy was founded to give newly graduated
        mental health students the practical, real-world training that licensure programs don&apos;t
        always cover — paired with a full year of mentorship after course completion.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm font-semibold text-ink-900">Credentials</p>
          <p className="mt-1 text-sm text-ink-700">Licensed Professional Counselor (LPC)</p>
        </div>
        <div className="card">
          <p className="text-sm font-semibold text-ink-900">Focus areas</p>
          <p className="mt-1 text-sm text-ink-700">
            Anxiety, life transitions, family systems, clinician development
          </p>
        </div>
      </div>
    </div>
  );
}
