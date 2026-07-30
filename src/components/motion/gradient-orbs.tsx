/**
 * Decorative, slow-drifting gradient blobs (pure CSS animation, no JS) used
 * behind hero and section content for depth. Purely presentational — always
 * rendered with aria-hidden and negative z-index.
 */
export function GradientOrbs({ variant = 'hero' }: { variant?: 'hero' | 'section' }) {
  if (variant === 'section') {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="blob left-1/2 top-0 h-72 w-72 -translate-x-1/2 bg-brand-200/40" />
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="blob -left-24 -top-24 h-96 w-96 bg-brand-300/40" style={{ animationDelay: '0s' }} />
      <div className="blob -right-32 top-20 h-[28rem] w-[28rem] bg-brand-500/20" style={{ animationDelay: '-6s' }} />
      <div className="blob bottom-0 left-1/3 h-80 w-80 bg-brand-100/60" style={{ animationDelay: '-12s' }} />
    </div>
  );
}
