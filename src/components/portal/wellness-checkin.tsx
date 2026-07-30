'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface Checkin {
  id: string;
  moodRating: number;
  reflection: string | null;
  createdAt: string;
}

const MOOD_LABELS = ['Struggling', 'Difficult', 'Steady', 'Good', 'Great'];

export function WellnessCheckin() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [moodRating, setMoodRating] = useState(3);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    fetch('/api/reflections')
      .then((res) => res.json())
      .then((body) => setCheckins(body.checkins ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/reflections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moodRating, reflection: reflection || undefined }),
    });
    if (res.ok) {
      setReflection('');
      setMoodRating(3);
      setComposing(false);
      load();
    }
    setSaving(false);
  }

  const latest = checkins[0];

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Your path</p>
          <h2 className="font-serif text-lg text-ink-900">Progress reflections</h2>
        </div>
        <button onClick={() => setComposing((v) => !v)} className="text-sm font-medium text-brand-700 hover:underline">
          {composing ? 'Cancel' : '+ Check in'}
        </button>
      </div>

      {composing && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl bg-paper-deep p-4">
          <div>
            <label className="label">How was your week?</label>
            <div className="flex gap-2">
              {MOOD_LABELS.map((moodLabel, i) => (
                <button
                  type="button"
                  key={moodLabel}
                  onClick={() => setMoodRating(i + 1)}
                  title={moodLabel}
                  className={`h-8 w-8 rounded-full transition-colors ${
                    moodRating === i + 1 ? 'bg-coral-deep' : 'bg-ink-100 hover:bg-mint'
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-700">{MOOD_LABELS[moodRating - 1]}</p>
          </div>
          <div>
            <label className="label" htmlFor="reflection">A quick reflection (optional)</label>
            <textarea
              id="reflection"
              className="input"
              rows={3}
              placeholder="What's one thing you noticed this week?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving…' : 'Save check-in'}
          </button>
        </form>
      )}

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-ink-700">Loading…</p>
        ) : !latest ? (
          <p className="text-sm text-ink-700">No check-ins yet — your reflections will show up here.</p>
        ) : (
          <div className="rounded-xl bg-mint/25 p-4">
            <p className="eyebrow">{format(new Date(latest.createdAt), 'MMM d').toUpperCase()}</p>
            {latest.reflection ? (
              <h3 className="mt-1 font-serif text-lg leading-snug text-ink-900">&ldquo;{latest.reflection}&rdquo;</h3>
            ) : (
              <p className="mt-1 text-sm text-ink-700">Feeling: {MOOD_LABELS[latest.moodRating - 1]}</p>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-ink-900/10 pt-3 text-xs text-ink-700">
              <span>How was your week?</span>
              <div className="flex gap-1">
                {MOOD_LABELS.map((moodLabel, i) => (
                  <span
                    key={moodLabel}
                    className={`h-2 w-2 rounded-full ${i + 1 <= latest.moodRating ? 'bg-coral-deep' : 'bg-ink-900/15'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
