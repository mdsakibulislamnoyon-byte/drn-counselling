import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type { NavItem } from '@/components/dashboard/dashboard-nav';
import { IconBook, IconShieldCheck, IconChat } from '@/components/dashboard/dashboard-icons';

const NAV_ITEMS: NavItem[] = [
  { href: '/student', label: 'My courses', icon: IconBook },
  { href: '/student/certificates', label: 'Certificates', icon: IconShieldCheck },
  { href: '/student/mentorship', label: 'Mentorship', icon: IconChat },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['student']);

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} portalLabel="Student Portal" accent="yellow">
      {children}
    </DashboardShell>
  );
}
