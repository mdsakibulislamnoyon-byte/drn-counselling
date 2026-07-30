import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type { NavItem } from '@/components/dashboard/dashboard-nav';
import { IconGrid, IconCalendar, IconChat, IconUser } from '@/components/dashboard/dashboard-icons';

const ICON_CLASS = 'h-4 w-4 shrink-0';

const NAV_ITEMS: NavItem[] = [
  { href: '/portal', label: 'Dashboard', icon: <IconGrid className={ICON_CLASS} /> },
  { href: '/portal/appointments', label: 'Appointments', icon: <IconCalendar className={ICON_CLASS} /> },
  { href: '/portal/messages', label: 'Messages', icon: <IconChat className={ICON_CLASS} /> },
  { href: '/portal/profile', label: 'Profile', icon: <IconUser className={ICON_CLASS} /> },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['patient']);

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} portalLabel="Patient Portal" accent="brand">
      {children}
    </DashboardShell>
  );
}
