import type { Metadata } from 'next';
import Link from 'next/link';
import { FadeIn } from '@/components/motion/fade-in';
import { GradientOrbs } from '@/components/motion/gradient-orbs';
import { ProviderMonogram } from '@/components/marketing/provider-monogram';
import { PRACTICE } from '@/lib/content/practice';

export const metadata: Metadata = { title: `About ${PRACTICE.providerName}` };

export default function AboutPage() {
  const philosophyParagraphs = PRACTICE.philosophy.trim().split('\n\n');

  return (
    <div>
      <section className="relative overflow-hidden py-16 md:py-20">
        <GradientOrbs variant="hero" />
        <div className="bg-mesh absolute inset-0 -z-10" />
        <div className="mx-auto max-w-4xl px-6">
          <FadeIn className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <ProviderMonogram />
            <div>
              <h1 className="font-serif text-4xl text-ink-900">{PRACTICE.providerName}</h1>
              <p className="mt-1 text-brand-700">{PRACTICE.credentialLabel}</p>
              <p className="mt-1 text-sm text-ink-700">{PRACTICE.legalName}</p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20">
        <FadeIn>
          <div className="card">
            <h2 className="font-serif text-2xl text-ink-900">My approach</h2>
            <div className="mt-4 space-y-4 text-ink-700">
              {philosophyParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-8">
          <h2 className="font-serif text-2xl text-ink-900">Areas of focus</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {PRACTICE.specialties.map((specialty) => (
              <span key={specialty} className="badge bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-100">
                {specialty}
              </span>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.15} className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="card">
            <p className="text-sm font-semibold text-ink-900">Credentials</p>
            <p className="mt-1 text-sm text-ink-700">{PRACTICE.credentialLabel}</p>
          </div>
          <div className="card">
            <p className="text-sm font-semibold text-ink-900">Location</p>
            <p className="mt-1 text-sm text-ink-700">
              {PRACTICE.address.line1}, {PRACTICE.address.line2}
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-10 text-center">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            Book a consultation
          </Link>
        </FadeIn>
      </section>
    </div>
  );
}
