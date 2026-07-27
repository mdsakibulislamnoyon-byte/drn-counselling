import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <span className="badge bg-brand-50 text-brand-700">Now accepting new patients</span>
            <h1 className="mt-5 font-serif text-4xl leading-tight text-ink-900 md:text-5xl">
              Compassionate counseling, and a training ground for the next generation of
              clinicians.
            </h1>
            <p className="mt-5 text-lg text-ink-700">
              Dominik Nicotera provides individual and family therapy alongside a professional
              training academy that helps newly graduated mental health clinicians build a
              confident, ethical practice.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register" className="btn-primary px-6 py-3 text-base">
                Book a consultation
              </Link>
              <Link href="/courses" className="btn-secondary px-6 py-3 text-base">
                Explore the academy
              </Link>
            </div>
          </div>
          <div className="card bg-brand-900 text-brand-50">
            <p className="font-serif text-xl">&ldquo;Growth happens in the space between where you
              are and where you&apos;re going — my job is to walk that space with you.&rdquo;</p>
            <p className="mt-6 text-sm text-brand-100">— Dominik Nicotera, LPC</p>
          </div>
        </div>
      </section>

      <section className="border-y border-ink-100 bg-ink-50 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
          {[
            {
              title: 'Individual & Family Therapy',
              body: 'Secure telehealth or in-person sessions with flexible scheduling and encrypted messaging between visits.',
              href: '/services',
            },
            {
              title: 'Clinician Training Academy',
              body: 'Self-paced, drip-scheduled video courses with quizzes, certificates, and a year of post-course mentorship.',
              href: '/courses',
            },
            {
              title: 'HIPAA-First by Design',
              body: 'Every account starts with a digital HIPAA acknowledgment and privacy consent, signed and timestamped for compliance.',
              href: '/faq',
            },
          ].map((f) => (
            <Link href={f.href} key={f.title} className="card transition-shadow hover:shadow-md">
              <h3 className="font-serif text-lg text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-700">{f.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="font-serif text-3xl text-ink-900">Ready to take the next step?</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-700">
          Create a secure account to schedule a session, or enroll in a course to start your
          professional development today.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            Create your account
          </Link>
        </div>
      </section>
    </div>
  );
}
