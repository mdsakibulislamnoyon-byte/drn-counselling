import type { Metadata } from 'next';
import Link from 'next/link';
import { FadeIn, StaggerGroup, StaggerItem } from '@/components/motion/fade-in';
import { GradientOrbs } from '@/components/motion/gradient-orbs';
import { SERVICES } from '@/lib/content/services';
import { PRACTICE } from '@/lib/content/practice';

export const metadata: Metadata = { title: 'Services' };

export default function ServicesPage() {
  return (
    <div>
      <section className="relative overflow-hidden py-16 md:py-20">
        <GradientOrbs variant="hero" />
        <div className="bg-mesh absolute inset-0 -z-10" />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <FadeIn>
            <h1 className="font-serif text-4xl text-ink-900">Services</h1>
            <p className="mx-auto mt-4 max-w-2xl text-ink-700">
              Every service below is booked and managed through your secure patient portal, protected by
              encrypted messaging and a signed HIPAA consent on file.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <StaggerGroup className="grid gap-6 sm:grid-cols-2" staggerDelay={0.06}>
          {SERVICES.map((service) => (
            <StaggerItem key={service.slug}>
              <div className="card card-hover h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <service.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-serif text-lg text-ink-900">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">{service.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <FadeIn delay={0.1} className="mt-12 card bg-brand-50">
          <p className="font-serif text-lg text-ink-900">Insurance &amp; self-pay</p>
          <p className="mt-2 text-sm text-ink-700">
            Insurance details are collected securely in your patient profile after registration. Self-pay and
            co-pay billing is processed securely through Stripe. Questions before you get started? Call or text{' '}
            <a href={PRACTICE.phoneHref} className="font-medium text-brand-700 underline">
              {PRACTICE.phone}
            </a>{' '}
            — {PRACTICE.phoneNote.toLowerCase()}.
          </p>
          <Link href="/register" className="btn-primary mt-4 inline-flex">
            Get started
          </Link>
        </FadeIn>
      </section>
    </div>
  );
}
