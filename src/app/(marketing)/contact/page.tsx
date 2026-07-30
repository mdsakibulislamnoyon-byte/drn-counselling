import type { Metadata } from 'next';
import { FadeIn } from '@/components/motion/fade-in';
import { GradientOrbs } from '@/components/motion/gradient-orbs';
import { IconPhone, IconMapPin, IconClock } from '@/components/marketing/service-icons';
import { PRACTICE } from '@/lib/content/practice';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  const fullAddress = `${PRACTICE.address.line1}, ${PRACTICE.address.line2}`;
  const mapEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;

  return (
    <div>
      <section className="relative overflow-hidden py-16 md:py-20">
        <GradientOrbs variant="hero" />
        <div className="bg-mesh absolute inset-0 -z-10" />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <FadeIn>
            <h1 className="font-serif text-4xl text-ink-900">Contact</h1>
            <p className="mx-auto mt-4 max-w-xl text-ink-700">
              For clinical questions or to discuss urgent needs, existing patients should use secure messaging
              inside the patient portal. For everything else, reach out below.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-10 md:grid-cols-2">
          <FadeIn direction="right">
            <div className="space-y-5">
              <div className="card flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <IconMapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">Address</p>
                  <p className="mt-1 text-sm text-ink-700">
                    {PRACTICE.address.line1}
                    <br />
                    {PRACTICE.address.line2}
                  </p>
                </div>
              </div>

              <div className="card flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <IconPhone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">Phone</p>
                  <a href={PRACTICE.phoneHref} className="mt-1 block text-sm text-brand-700 hover:underline">
                    {PRACTICE.phone}
                  </a>
                  <p className="text-xs text-ink-700">{PRACTICE.phoneNote}</p>
                </div>
              </div>

              <div className="card flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <IconClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">Hours</p>
                  <p className="mt-1 text-sm text-ink-700">{PRACTICE.hours.office}</p>
                  <p className="text-xs text-ink-700">{PRACTICE.hours.availability}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-ink-100 shadow-sm">
                <iframe
                  title="Map to DRN Counseling and Consulting"
                  src={mapEmbedSrc}
                  className="h-56 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="left" delay={0.1}>
            <form className="card space-y-4" action="/api/contact" method="POST">
              <h2 className="font-serif text-xl text-ink-900">Send a message</h2>
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input className="input" id="name" name="name" required />
              </div>
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input className="input" id="email" name="email" type="email" required />
              </div>
              <div>
                <label className="label" htmlFor="message">Message</label>
                <textarea className="input" id="message" name="message" rows={5} required />
              </div>
              <button type="submit" className="btn-primary w-full">Send message</button>
            </form>
          </FadeIn>
        </div>

        <FadeIn delay={0.15} className="mt-10 text-center text-sm text-ink-700">
          If you are experiencing a medical emergency, please call 911 or go to your nearest emergency room.
          For a mental health crisis, you can also call or text 988 (Suicide &amp; Crisis Lifeline).
        </FadeIn>
      </section>
    </div>
  );
}
