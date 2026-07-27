import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { Profile } from '@/types/database';
import { RoleSelect } from './role-select';

export default async function AdminUsersPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Profile[]>();

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Users & roles</h1>
      <p className="mt-1 text-ink-700">
        Assign roles to elevate an account (e.g. promote staff to provider). Fine-grained
        permission overrides are managed per-user via the permissions API.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink-100">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-700">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(users ?? []).map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-ink-900">{u.full_name}</td>
                <td className="px-4 py-3 text-ink-700">{u.email}</td>
                <td className="px-4 py-3"><RoleSelect userId={u.id} currentRole={u.role} /></td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.is_active ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'}`}>
                    {u.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
