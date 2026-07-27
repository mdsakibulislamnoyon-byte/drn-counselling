import { requireRole } from '@/lib/auth';
import { DashboardShell, type NavItem } from '@/components/dashboard/dashboard-shell';

const NAV_ITEMS: NavItem[] = [
  { href: '/provider', label: 'Dashboard' },
  { href: '/provider/schedule', label: 'Schedule' },
  { href: '/provider/patients', label: 'Patients' },
  { href: '/provider/messages', label: 'Messages' },
];

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['provider', 'staff', 'admin']);

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} portalLabel="Provider Dashboard">
      {children}
    </DashboardShell>
  );
}
