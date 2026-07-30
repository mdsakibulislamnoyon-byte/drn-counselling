import Link from 'next/link';
import { SignOutButton } from '@/components/dashboard/sign-out-button';
import { DashboardNav, type NavItem } from '@/components/dashboard/dashboard-nav';
import type { Profile } from '@/types/database';

export type { NavItem };

const ACCENT_BADGE: Record<string, string> = {
  brand: 'bg-mint text-brand-900',
  blue: 'bg-accent-blue text-accent-blue-deep',
  coral: 'bg-coral text-coral-deep',
  yellow: 'bg-accent-yellow text-amber-900',
};

export function DashboardShell({
  profile,
  navItems,
  portalLabel,
  accent = 'brand',
  children,
}: {
  profile: Profile;
  navItems: NavItem[];
  portalLabel: string;
  accent?: keyof typeof ACCENT_BADGE;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-paper-deep">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-100 bg-white p-6 md:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <span className={`icon-badge h-9 w-9 rounded-lg font-serif text-sm ${ACCENT_BADGE[accent]}`}>
            DN
          </span>
          <span className="font-serif text-base leading-tight text-ink-900">{profile.full_name}</span>
        </Link>
        <p className="eyebrow mt-3">{portalLabel}</p>

        <DashboardNav navItems={navItems} />

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
