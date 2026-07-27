import { requireRole } from '@/lib/auth';
import { DashboardShell, type NavItem } from '@/components/dashboard/dashboard-shell';

const NAV_ITEMS: NavItem[] = [
  { href: '/student', label: 'My courses' },
  { href: '/student/certificates', label: 'Certificates' },
  { href: '/student/mentorship', label: 'Mentorship' },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['student']);

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} portalLabel="Student Portal">
      {children}
    </DashboardShell>
  );
}
