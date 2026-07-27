'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CreateCourseForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [dripDays, setDripDays] = useState('7');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        slug,
        priceCents: Math.round(parseFloat(price || '0') * 100),
        dripIntervalDays: parseInt(dripDays || '7', 10),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Unable to create course.');
      setLoading(false);
      return;
    }
    setTitle('');
    setSlug('');
    setPrice('');
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input className="input" placeholder="slug-like-this" value={slug} onChange={(e) => setSlug(e.target.value)} required />
      <div className="grid grid-cols-2 gap-3">
        <input className="input" placeholder="Price (USD)" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <input className="input" placeholder="Drip days" type="number" value={dripDays} onChange={(e) => setDripDays(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Creating…' : 'Create course (draft)'}
      </button>
    </form>
  );
}
