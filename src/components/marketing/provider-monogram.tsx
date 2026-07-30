/**
 * Stands in for a headshot until a real photo is available. Deliberately
 * not a stock photo — presenting a stock image as Dominick would be
 * misleading. Swap for a real <img> the moment one exists.
 */
export function ProviderMonogram({ className = 'h-40 w-40' }: { className?: string }) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-400 via-brand-600 to-brand-900 opacity-90" />
      <div className="absolute inset-0 rounded-full bg-mesh mix-blend-overlay" />
      <div className="absolute inset-[3px] rounded-full ring-1 ring-inset ring-white/30" />
      <div className="relative flex h-full w-full items-center justify-center">
        <span className="font-serif text-4xl tracking-wide text-white">DN</span>
      </div>
    </div>
  );
}
