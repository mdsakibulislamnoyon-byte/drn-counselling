'use client';

import { useState } from 'react';

export function EnrollButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Unable to start checkout.');
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      <button onClick={handleEnroll} disabled={loading} className="btn-primary w-full py-3">
        {loading ? 'Redirecting to checkout…' : 'Enroll now'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
