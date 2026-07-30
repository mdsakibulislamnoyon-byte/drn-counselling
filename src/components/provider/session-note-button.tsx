'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SessionNoteButton({ appointmentId, hasNote }: { appointmentId: string; hasNote: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    const res = await fetch(`/api/appointments/${appointmentId}/note`);
    if (res.ok) {
      const body = await res.json();
      setNote(body.note ?? '');
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/appointments/${appointmentId}/note`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button onClick={handleOpen} className={hasNote ? 'btn-ghost' : 'btn-secondary'}>
        {hasNote ? 'Edit note' : 'Add note'}
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl bg-paper-deep p-3">
      {loading ? (
        <p className="text-sm text-ink-700">Loading…</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-2">
          <textarea
            className="input"
            rows={4}
            placeholder="Clinical session note…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save note'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
