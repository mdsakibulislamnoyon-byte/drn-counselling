import { requireRole } from '@/lib/auth';
import { DashboardShell, type NavItem } from '@/components/dashboard/dashboard-shell';

const NAV_ITEMS: NavItem[] = [
  { href: '/portal', label: 'Dashboard' },
  { href: '/portal/appointments', label: 'Appointments' },
  { href: '/portal/messages', label: 'Messages' },
  { href: '/portal/profile', label: 'Profile' },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['patient']);

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} portalLabel="Patient Portal">
      {children}
    </DashboardShell>
  );
}
