import Link from 'next/link';
import { IconPhone, IconMapPin, IconClock } from '@/components/marketing/service-icons';
import { PRACTICE } from '@/lib/content/practice';

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-100 bg-ink-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <p className="font-serif text-lg text-ink-900">{PRACTICE.shortName}</p>
          <p className="mt-1 text-xs text-ink-700">{PRACTICE.legalName}</p>
          <p className="mt-3 text-sm text-ink-700">
            {PRACTICE.providerName}, {PRACTICE.credentials} — individual, family, and group therapy, serving
            Central New York, alongside a professional training academy for newly graduated mental health
            clinicians.
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-ink-900">Contact</p>
          <ul className="space-y-2.5 text-sm text-ink-700">
            <li className="flex items-start gap-2">
              <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <span>
                {PRACTICE.address.line1}
                <br />
                {PRACTICE.address.line2}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <IconPhone className="h-4 w-4 shrink-0 text-brand-600" />
              <a href={PRACTICE.phoneHref} className="hover:text-brand-700">
                {PRACTICE.phone}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <IconClock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <span>
                {PRACTICE.hours.office}
                <br />
                {PRACTICE.hours.availability}
              </span>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-ink-900">Practice</p>
          <ul className="space-y-2 text-sm text-ink-700">
            <li><Link href="/about" className="hover:text-brand-700">About Dominick</Link></li>
            <li><Link href="/services" className="hover:text-brand-700">Services</Link></li>
            <li><Link href="/contact" className="hover:text-brand-700">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-ink-900">Academy &amp; account</p>
          <ul className="space-y-2 text-sm text-ink-700">
            <li><Link href="/courses" className="hover:text-brand-700">Course catalog</Link></li>
            <li><Link href="/faq" className="hover:text-brand-700">FAQ</Link></li>
            <li><Link href="/login" className="hover:text-brand-700">Log in</Link></li>
            <li><Link href="/register" className="hover:text-brand-700">Create account</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-100 px-6 py-6 text-center text-xs text-ink-700">
        © {new Date().getFullYear()} {PRACTICE.legalName}. All rights reserved. If you are experiencing a medical
        emergency, call 911 or go to your nearest emergency room.
      </div>
    </footer>
  );
}
