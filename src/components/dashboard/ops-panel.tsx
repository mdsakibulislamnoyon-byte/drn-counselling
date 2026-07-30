export interface OpsCheck {
  label: string;
  ok: boolean;
  detail: string;
}

/** Renders real, server-verified checks — never fabricated status like "backups verified 4am". */
export function OpsPanel({ checks }: { checks: OpsCheck[] }) {
  return (
    <div className="divide-y divide-ink-100">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center justify-between py-2.5 text-sm">
          <div>
            <p className="font-medium text-ink-900">{check.label}</p>
            <p className="text-xs text-ink-700">{check.detail}</p>
          </div>
          <span className={`badge ${check.ok ? 'bg-mint/40 text-brand-800' : 'bg-accent-yellow/40 text-amber-800'}`}>
            {check.ok ? 'OK' : 'Needs setup'}
          </span>
        </div>
      ))}
    </div>
  );
}
