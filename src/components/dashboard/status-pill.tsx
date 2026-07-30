type Tone = 'positive' | 'info' | 'warning' | 'negative' | 'neutral';

const TONE_STYLES: Record<Tone, string> = {
  positive: 'bg-mint/40 text-brand-800',
  info: 'bg-accent-blue/30 text-accent-blue-deep',
  warning: 'bg-accent-yellow/40 text-amber-800',
  negative: 'bg-coral/25 text-coral-deep',
  neutral: 'bg-ink-100 text-ink-700',
};

const STATUS_TONE: Record<string, Tone> = {
  // appointments
  requested: 'warning',
  confirmed: 'positive',
  completed: 'positive',
  cancelled: 'negative',
  no_show: 'negative',
  // enrollments
  active: 'info',
  refunded: 'negative',
  // lesson progress
  locked: 'neutral',
  available: 'info',
  in_progress: 'warning',
  // payments
  pending: 'warning',
  succeeded: 'positive',
  failed: 'negative',
  partially_refunded: 'warning',
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  const tone = STATUS_TONE[status] ?? 'neutral';
  return (
    <span className={`badge capitalize ${TONE_STYLES[tone]}`}>
      {(label ?? status).replace(/_/g, ' ')}
    </span>
  );
}
