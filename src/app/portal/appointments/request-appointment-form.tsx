'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types/database';

export function RequestAppointmentForm({ providers }: { providers: Profile[] }) {
  const router = useRouter();
  const [providerId, setProviderId] = useState(providers[0]?.id ?? '');
  const [startTime, setStartTime] = useState('');
  const [type, setType] = useState('individual_session');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const start = new Date(startTime);
    const end = new Date(start.getTime() + 50 * 60 * 1000);

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type,
        patientNotes: notes,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Unable to request appointment.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
  }

  if (providers.length === 0) {
    return <p className="mt-4 text-sm text-ink-700">No providers are available for booking right now.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="label" htmlFor="provider">Provider</label>
        <select id="provider" className="input" value={providerId} onChange={(e) => setProviderId(e.target.value)}>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="type">Session type</label>
        <select id="type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="initial_consult">Initial consult</option>
          <option value="individual_session">Individual session</option>
          <option value="family_session">Family session</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="startTime">Preferred date & time</label>
        <input
          id="startTime"
          type="datetime-local"
          className="input"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="notes">Notes (optional)</label>
        <textarea id="notes" className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-brand-700">Request sent — you&apos;ll be notified once confirmed.</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Sending request…' : 'Request appointment'}
      </button>
    </form>
  );
}
