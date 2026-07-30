import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type { NavItem } from '@/components/dashboard/dashboard-nav';
import { IconGrid, IconUsers, IconBook, IconCalendar, IconTag, IconShieldCheck } from '@/components/dashboard/dashboard-icons';

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: IconGrid },
  { href: '/admin/users', label: 'Users & roles', icon: IconShieldCheck },
  { href: '/admin/students', label: 'Student roster', icon: IconUsers },
  { href: '/admin/appointments', label: 'Appointments', icon: IconCalendar },
  { href: '/admin/courses', label: 'Courses', icon: IconBook },
  { href: '/admin/promo-codes', label: 'Promo codes', icon: IconTag },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['admin']);

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} portalLabel="Super Admin" accent="coral">
      {children}
    </DashboardShell>
  );
}
