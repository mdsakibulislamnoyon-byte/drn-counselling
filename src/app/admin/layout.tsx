import { requireRole } from '@/lib/auth';
import { DashboardShell, type NavItem } from '@/components/dashboard/dashboard-shell';

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users & roles' },
  { href: '/admin/students', label: 'Student roster' },
  { href: '/admin/appointments', label: 'Appointments' },
  { href: '/admin/courses', label: 'Courses' },
  { href: '/admin/promo-codes', label: 'Promo codes' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['admin']);

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} portalLabel="Super Admin">
      {children}
    </DashboardShell>
  );
}
