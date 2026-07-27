'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CreatePromoCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed_amount'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const value =
      discountType === 'percent'
        ? parseInt(discountValue || '0', 10)
        : Math.round(parseFloat(discountValue || '0') * 100);

    const res = await fetch('/api/admin/promo-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, discountType, discountValue: value }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Unable to create promo code.');
      setLoading(false);
      return;
    }

    setCode('');
    setDiscountValue('');
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <input className="input font-mono uppercase" placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} required />
      <select className="input" value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed_amount')}>
        <option value="percent">Percent off</option>
        <option value="fixed_amount">Fixed amount off (USD)</option>
      </select>
      <input
        className="input"
        type="number"
        placeholder={discountType === 'percent' ? '10' : '25.00'}
        value={discountValue}
        onChange={(e) => setDiscountValue(e.target.value)}
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Creating…' : 'Create code'}
      </button>
    </form>
  );
}
