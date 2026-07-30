'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export interface NavItem {
  href: string;
  label: string;
  // A rendered element, not a component reference — Server Components
  // (the layout.tsx files that build this array) can't pass function
  // values across the boundary into this Client Component.
  icon?: ReactNode;
}

export function DashboardNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="mt-8 flex-1 space-y-1">
      {navItems.map((item) => {
        const isCurrent = item.href === pathname || (item.href !== '/' && pathname?.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isCurrent ? 'bg-mint/35 text-brand-800' : 'text-ink-700 hover:bg-ink-50 hover:text-ink-900'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
