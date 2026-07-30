import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type { NavItem } from '@/components/dashboard/dashboard-nav';
import { IconBook, IconShieldCheck, IconChat } from '@/components/dashboard/dashboard-icons';

const ICON_CLASS = 'h-4 w-4 shrink-0';

const NAV_ITEMS: NavItem[] = [
  { href: '/student', label: 'My courses', icon: <IconBook className={ICON_CLASS} /> },
  { href: '/student/certificates', label: 'Certificates', icon: <IconShieldCheck className={ICON_CLASS} /> },
  { href: '/student/mentorship', label: 'Mentorship', icon: <IconChat className={ICON_CLASS} /> },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['student']);

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} portalLabel="Student Portal" accent="yellow">
      {children}
    </DashboardShell>
  );
}
