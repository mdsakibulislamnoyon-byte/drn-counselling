import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type { NavItem } from '@/components/dashboard/dashboard-nav';
import { IconGrid, IconCalendar, IconChat, IconUser } from '@/components/dashboard/dashboard-icons';

const NAV_ITEMS: NavItem[] = [
  { href: '/portal', label: 'Dashboard', icon: IconGrid },
  { href: '/portal/appointments', label: 'Appointments', icon: IconCalendar },
  { href: '/portal/messages', label: 'Messages', icon: IconChat },
  { href: '/portal/profile', label: 'Profile', icon: IconUser },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['patient']);

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} portalLabel="Patient Portal" accent="brand">
      {children}
    </DashboardShell>
  );
}
