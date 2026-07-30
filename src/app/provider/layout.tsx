import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type { NavItem } from '@/components/dashboard/dashboard-nav';
import { IconGrid, IconCalendar, IconUsers, IconChat, IconBook } from '@/components/dashboard/dashboard-icons';

const NAV_ITEMS: NavItem[] = [
  { href: '/provider', label: 'Dashboard', icon: IconGrid },
  { href: '/provider/schedule', label: 'Schedule', icon: IconCalendar },
  { href: '/provider/patients', label: 'Patients', icon: IconUsers },
  { href: '/provider/messages', label: 'Messages', icon: IconChat },
  { href: '/provider/courses', label: 'Courses', icon: IconBook },
];

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['provider', 'staff', 'admin']);

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} portalLabel="Provider Dashboard" accent="blue">
      {children}
    </DashboardShell>
  );
}
