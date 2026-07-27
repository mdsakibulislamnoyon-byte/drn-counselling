import Link from 'next/link';
import { SignOutButton } from '@/components/dashboard/sign-out-button';
import type { Profile } from '@/types/database';

export interface NavItem {
  href: string;
  label: string;
}

export function DashboardShell({
  profile,
  navItems,
  portalLabel,
  children,
}: {
  profile: Profile;
  navItems: NavItem[];
  portalLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-100 bg-white p-6 md:flex">
        <Link href="/" className="font-serif text-lg text-ink-900">
          {profile.full_name}
        </Link>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand-600">
          {portalLabel}
        </p>

        <nav className="mt-8 flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 hover:text-ink-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-ink-100 pt-4">
          <p className="text-xs capitalize text-ink-700">Signed in as {profile.role}</p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-ink-100 bg-white px-6 py-4 md:hidden">
          <span className="font-serif text-lg text-ink-900">{profile.full_name}</span>
          <SignOutButton />
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
