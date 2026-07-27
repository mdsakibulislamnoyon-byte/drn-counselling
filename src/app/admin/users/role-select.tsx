'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/types/database';

const ROLES: UserRole[] = ['patient', 'provider', 'staff', 'student', 'admin'];

export function RoleSelect({ userId, currentRole }: { userId: string; currentRole: UserRole }) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);

  async function handleChange(newRole: UserRole) {
    setRole(newRole);
    setSaving(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      className="rounded-lg border border-ink-100 px-2 py-1 text-sm capitalize disabled:opacity-50"
      value={role}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as UserRole)}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  );
}
