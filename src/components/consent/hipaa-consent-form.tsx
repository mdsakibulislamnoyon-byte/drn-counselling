'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ConsentDocument } from '@/types/database';

export function HipaaConsentForm({
  documents,
  redirectTo,
}: {
  documents: ConsentDocument[];
  redirectTo: string;
}) {
  const router = useRouter();
  const [signatureFullName, setSignatureFullName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentIds: documents.map((d) => d.id),
        signatureFullName,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Unable to record your consent. Please try again.');
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {documents.map((doc) => (
        <div key={doc.id} className="card">
          <h2 className="font-serif text-xl text-ink-900">{doc.title}</h2>
          <p className="mt-1 text-xs uppercase tracking-wide text-ink-700">Version {doc.version}</p>
          <div className="mt-4 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-ink-50 p-4 text-sm text-ink-700">
            {doc.body_md}
          </div>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="flex items-start gap-3">
          <input
            id="agree"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-ink-100 text-brand-600"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
          />
          <label htmlFor="agree" className="text-sm text-ink-700">
            I have read and agree to the document(s) above. I understand that typing my full name
            below acts as my legal electronic signature.
          </label>
        </div>

        <div>
          <label className="label" htmlFor="signature">Type your full legal name to sign</label>
          <input
            id="signature"
            className="input font-serif text-lg"
            value={signatureFullName}
            onChange={(e) => setSignatureFullName(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={!agreed || loading} className="btn-primary w-full py-3">
          {loading ? 'Recording your signature…' : 'Sign & continue'}
        </button>
      </form>
    </div>
  );
}
