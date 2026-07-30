import Link from 'next/link';
import { GradientOrbs } from '@/components/motion/gradient-orbs';
import { FadeIn, StaggerGroup, StaggerItem } from '@/components/motion/fade-in';
import { ProviderMonogram } from '@/components/marketing/provider-monogram';
import { IconPhone, IconMapPin, IconClock } from '@/components/marketing/service-icons';
import { SERVICES } from '@/lib/content/services';
import { PRACTICE } from '@/lib/content/practice';

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <GradientOrbs variant="hero" />
        <div className="bg-mesh absolute inset-0 -z-10" />
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-32">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <FadeIn>
              <span className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
                Now accepting new patients in Central New York
              </span>
              <h1 className="mt-5 font-serif text-4xl leading-tight text-ink-900 md:text-5xl">
                Compassionate counseling, built around{' '}
                <span className="text-gradient">your goals for change.</span>
              </h1>
              <p className="mt-5 text-lg text-ink-700">
                {PRACTICE.providerName}, {PRACTICE.credentials}, leads {PRACTICE.legalName} — offering
                individual, family, and group therapy across Central New York, alongside a professional
                training academy for newly graduated mental health clinicians.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/register" className="btn-primary px-6 py-3 text-base">
                  Book a consultation
                </Link>
                <Link href="/services" className="btn-secondary px-6 py-3 text-base">
                  Explore services
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-700">
                <a href={PRACTICE.phoneHref} className="flex items-center gap-1.5 hover:text-brand-700">
                  <IconPhone className="h-4 w-4 text-brand-600" /> {PRACTICE.phone}
                </a>
                <span className="flex items-center gap-1.5">
                  <IconMapPin className="h-4 w-4 text-brand-600" /> Utica, NY
                </span>
                <span className="flex items-center gap-1.5">
                  <IconClock className="h-4 w-4 text-brand-600" /> {PRACTICE.hours.availability}
                </span>
              </div>
            </FadeIn>

            <FadeIn direction="left" delay={0.15}>
              <div className="relative rounded-2xl bg-brand-900 p-8 text-brand-50 shadow-xl">
                <div className="flex items-center gap-4">
                  <ProviderMonogram className="h-16 w-16 shrink-0" />
                  <div>
                    <p className="font-serif text-lg text-white">{PRACTICE.providerName}</p>
                    <p className="text-sm text-brand-200">{PRACTICE.credentialLabel}</p>
                  </div>
                </div>
                <p className="mt-6 font-serif text-xl leading-relaxed">
                  &ldquo;The importance of motivation and goals for change is paramount to the success of the
                  client.&rdquo;
                </p>
                <Link href="/about" className="mt-6 inline-block text-sm font-medium text-brand-100 underline">
                  Read Dominick&apos;s approach →
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="relative border-y border-ink-100 bg-ink-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl text-ink-900">Services built around real needs</h2>
            <p className="mt-3 text-ink-700">
              From one-on-one sessions to specialized programs for veterans and substance dependence, every
              service is delivered with the same welcoming, open-minded approach.
            </p>
          </FadeIn>

          <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.slice(0, 4).map((service) => (
              <StaggerItem key={service.slug}>
                <Link href="/services" className="card card-hover group block h-full">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-serif text-lg text-ink-900">{service.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-700">{service.description}</p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <FadeIn className="mt-10 text-center" delay={0.1}>
            <Link href="/services" className="btn-secondary">
              View all services
            </Link>
          </FadeIn>
        </div>
      </section>

      <section className="relative overflow-hidden py-20">
        <GradientOrbs variant="section" />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <FadeIn>
            <h2 className="font-serif text-3xl text-ink-900">Clinician Training Academy</h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-700">
              Self-paced, drip-scheduled video courses built for newly graduated mental health clinicians —
              complete with quizzes, certificates, and a year of post-course mentorship.
            </p>
            <Link href="/courses" className="btn-primary mt-8 inline-flex px-6 py-3 text-base">
              Browse the academy
            </Link>
          </FadeIn>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-ink-50 py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <FadeIn>
            <h2 className="font-serif text-3xl text-ink-900">Ready to take the next step?</h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-700">
              Create a secure account to schedule a session, or reach out directly — {PRACTICE.phoneNote.toLowerCase()}.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/register" className="btn-primary px-6 py-3 text-base">
                Create your account
              </Link>
              <a href={PRACTICE.phoneHref} className="btn-secondary px-6 py-3 text-base">
                Call {PRACTICE.phone}
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
