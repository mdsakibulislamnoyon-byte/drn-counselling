import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { PromoCode } from '@/types/database';
import { CreatePromoCodeForm } from './create-promo-code-form';

export default async function AdminPromoCodesPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data: codes } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<PromoCode[]>();

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Promo codes</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border border-ink-100">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-700">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Redemptions</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {(codes ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono font-medium text-ink-900">{c.code}</td>
                  <td className="px-4 py-3 text-ink-700">
                    {c.discount_type === 'percent' ? `${c.discount_value}%` : `$${(c.discount_value / 100).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {c.times_redeemed}{c.max_redemptions ? ` / ${c.max_redemptions}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${c.is_active ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-700'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!codes || codes.length === 0) && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-700">No promo codes yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card h-fit">
          <h2 className="font-serif text-lg text-ink-900">New promo code</h2>
          <CreatePromoCodeForm />
        </div>
      </div>
    </div>
  );
}
