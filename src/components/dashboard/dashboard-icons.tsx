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

export function IconGrid(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </Base>
  );
}

export function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </Base>
  );
}

export function IconChat(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 5h16v11H8l-4 4z" />
    </Base>
  );
}

export function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 20c1-3.6 4-5.6 7.5-5.6s6.5 2 7.5 5.6" />
    </Base>
  );
}

export function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="8.5" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.4" />
      <path d="M2.7 19c.6-3.2 2.9-5 5.8-5s5.2 1.8 5.8 5" />
      <path d="M14.2 14.4c2.4.2 4.2 1.9 4.7 4.6" />
    </Base>
  );
}

export function IconBook(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 4.8c2-1 5-1 8 .5 3-1.5 6-1.5 8-.5v13.7c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5z" />
      <path d="M12 5.3v13.7" />
    </Base>
  );
}

export function IconTag(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M11.5 3.5H5a1.5 1.5 0 00-1.5 1.5v6.5a1.5 1.5 0 00.44 1.06l9 9a1.5 1.5 0 002.12 0l7-7a1.5 1.5 0 000-2.12l-9-9a1.5 1.5 0 00-1.06-.44z" />
      <circle cx="8.2" cy="8.2" r="1.3" />
    </Base>
  );
}

export function IconTrendingUp(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3.5 16.5l6-6 4 4 7-7" />
      <path d="M15 7.5h5.5V13" />
    </Base>
  );
}

export function IconDollar(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 2.5v19M16.5 6.5c0-1.7-2-3-4.5-3s-4.5 1.2-4.5 3 2 2.6 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3" />
    </Base>
  );
}

export function IconActivity(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3 12h4l2.2-7 4.2 14 2.2-7H21" />
    </Base>
  );
}

export function IconShieldCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </Base>
  );
}
