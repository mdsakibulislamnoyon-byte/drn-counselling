import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type { NavItem } from '@/components/dashboard/dashboard-nav';
import { IconGrid, IconUsers, IconBook, IconCalendar, IconTag, IconShieldCheck } from '@/components/dashboard/dashboard-icons';

const ICON_CLASS = 'h-4 w-4 shrink-0';

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: <IconGrid className={ICON_CLASS} /> },
  { href: '/admin/users', label: 'Users & roles', icon: <IconShieldCheck className={ICON_CLASS} /> },
  { href: '/admin/students', label: 'Student roster', icon: <IconUsers className={ICON_CLASS} /> },
  { href: '/admin/appointments', label: 'Appointments', icon: <IconCalendar className={ICON_CLASS} /> },
  { href: '/admin/courses', label: 'Courses', icon: <IconBook className={ICON_CLASS} /> },
  { href: '/admin/promo-codes', label: 'Promo codes', icon: <IconTag className={ICON_CLASS} /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['admin']);

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} portalLabel="Super Admin" accent="coral">
      {children}
    </DashboardShell>
  );
}
