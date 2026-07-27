import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { roleHomePath } from '@/lib/auth';
import { SignOutButton } from '@/components/dashboard/sign-out-button';

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/courses', label: 'LMS Courses' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let portalHref = '/portal';
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile) portalHref = roleHomePath(profile.role);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-lg font-medium text-ink-900">
          Dominik Nicotera <span className="text-brand-600">Counselling</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-700 hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href={portalHref} className="btn-primary">
                Go to my portal
              </Link>
              <div className="hidden sm:block">
                <SignOutButton className="btn-ghost text-sm" />
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
