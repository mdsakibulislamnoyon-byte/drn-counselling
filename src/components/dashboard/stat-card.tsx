import type { ComponentType, SVGProps } from 'react';

const TONE_BG: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-700',
  mint: 'bg-mint/40 text-brand-800',
  blue: 'bg-accent-blue/30 text-accent-blue-deep',
  coral: 'bg-coral/25 text-coral-deep',
  yellow: 'bg-accent-yellow/40 text-amber-800',
};

export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  tone = 'brand',
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string | number;
  sublabel?: string;
  tone?: keyof typeof TONE_BG;
}) {
  return (
    <div className="stat-card">
      <div className={`icon-badge ${TONE_BG[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-ink-700">{label}</p>
        <p className="mt-0.5 font-serif text-2xl text-ink-900">{value}</p>
        {sublabel && <p className="mt-0.5 text-xs text-mint-deep">{sublabel}</p>}
      </div>
    </div>
  );
}
