/** Small, hand-drawn stroke icons for the service catalog — no icon library dependency. */
import type { SVGProps } from 'react';

function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function IconHeart(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 20.5s-7.5-4.6-9.8-9.1C.6 8 2 4.5 5.6 4c2-.3 3.7.6 4.9 2.2C11.7 4.6 13.4 3.7 15.4 4c3.6.5 5 4 3.4 7.4-2.3 4.5-9.8 9.1-9.8 9.1z" />
    </Base>
  );
}

export function IconFamily(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="8" cy="7" r="2.4" />
      <circle cx="16" cy="7" r="2.4" />
      <path d="M3.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5" />
      <path d="M11.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5" />
    </Base>
  );
}

export function IconGroup(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="7" cy="8" r="2.2" />
      <circle cx="17" cy="8" r="2.2" />
      <circle cx="12" cy="12.5" r="2.4" />
      <path d="M2.5 19c.4-2.4 2.1-4 4.5-4s4.1 1.6 4.5 4" />
      <path d="M12.5 19c.4-2.4 2.1-4 4.5-4s4.1 1.6 4.5 4" opacity=".55" />
    </Base>
  );
}

export function IconCompass(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-2 6-6 2 2-6z" />
    </Base>
  );
}

export function IconShieldPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z" />
      <path d="M12 9v6M9 12h6" />
    </Base>
  );
}

export function IconMedal(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="14.5" r="5.5" />
      <path d="M9.5 9.5L7 3M14.5 9.5L17 3" />
      <path d="M12 12.5l.9 1.9 2.1.3-1.5 1.4.35 2.1-1.85-1-1.85 1 .35-2.1-1.5-1.4 2.1-.3z" />
    </Base>
  );
}

export function IconClipboardCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
      <path d="M9 12l2 2 4-4" />
    </Base>
  );
}

export function IconMapPin(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.4" />
    </Base>
  );
}

export function IconPhone(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 4.5C4 14 10 20 19.5 20c.6 0 1-.5.9-1l-.6-3a1 1 0 00-.9-.8l-3.3-.4a1 1 0 00-.9.4l-1 1.3a13 13 0 01-6.2-6.2l1.3-1a1 1 0 00.4-.9L8.8 5a1 1 0 00-.8-.9l-3-.6a1 1 0 00-1 .9z" />
    </Base>
  );
}

export function IconClock(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Base>
  );
}
