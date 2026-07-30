import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type { NavItem } from '@/components/dashboard/dashboard-nav';
import { IconGrid, IconCalendar, IconUsers, IconChat, IconBook } from '@/components/dashboard/dashboard-icons';

const ICON_CLASS = 'h-4 w-4 shrink-0';

const NAV_ITEMS: NavItem[] = [
  { href: '/provider', label: 'Dashboard', icon: <IconGrid className={ICON_CLASS} /> },
  { href: '/provider/schedule', label: 'Schedule', icon: <IconCalendar className={ICON_CLASS} /> },
  { href: '/provider/patients', label: 'Patients', icon: <IconUsers className={ICON_CLASS} /> },
  { href: '/provider/messages', label: 'Messages', icon: <IconChat className={ICON_CLASS} /> },
  { href: '/provider/courses', label: 'Courses', icon: <IconBook className={ICON_CLASS} /> },
];

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['provider', 'staff', 'admin']);

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} portalLabel="Provider Dashboard" accent="blue">
      {children}
    </DashboardShell>
  );
}
