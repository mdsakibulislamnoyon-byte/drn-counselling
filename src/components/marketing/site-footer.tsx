import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-100 bg-ink-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <p className="font-serif text-lg text-ink-900">Dominik Nicotera Counselling</p>
          <p className="mt-2 text-sm text-ink-700">
            Individual, family, and telehealth counseling — and a professional training
            academy for newly graduated mental health clinicians.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-ink-900">Practice</p>
          <ul className="space-y-2 text-sm text-ink-700">
            <li><Link href="/about" className="hover:text-brand-700">About Dominik</Link></li>
            <li><Link href="/services" className="hover:text-brand-700">Services</Link></li>
            <li><Link href="/contact" className="hover:text-brand-700">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-ink-900">Academy</p>
          <ul className="space-y-2 text-sm text-ink-700">
            <li><Link href="/courses" className="hover:text-brand-700">Course catalog</Link></li>
            <li><Link href="/faq" className="hover:text-brand-700">FAQ</Link></li>
            <li><Link href="/student" className="hover:text-brand-700">Student portal</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-ink-900">Account</p>
          <ul className="space-y-2 text-sm text-ink-700">
            <li><Link href="/login" className="hover:text-brand-700">Log in</Link></li>
            <li><Link href="/register" className="hover:text-brand-700">Create account</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-100 px-6 py-6 text-center text-xs text-ink-700">
        © {new Date().getFullYear()} Dominik Nicotera Counselling. All rights reserved. If you
        are experiencing a medical emergency, call 911 or go to your nearest emergency room.
      </div>
    </footer>
  );
}
