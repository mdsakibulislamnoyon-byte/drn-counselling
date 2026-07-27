import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@/types/database';

const ROLE_HOME: Record<UserRole, string> = {
  patient: '/portal',
  provider: '/provider',
  staff: '/provider',
  student: '/student',
  admin: '/admin',
};

const PROTECTED_PREFIXES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/portal', roles: ['patient'] },
  { prefix: '/provider', roles: ['provider', 'staff', 'admin'] },
  { prefix: '/student', roles: ['student'] },
  { prefix: '/admin', roles: ['admin'] },
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session cookie on every request — required by @supabase/ssr
  // so server components downstream see a valid, non-expired session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const match = PROTECTED_PREFIXES.find((p) => request.nextUrl.pathname.startsWith(p.prefix));
  if (!match) return response;

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role as UserRole | undefined;

  if (!role || !match.roles.includes(role)) {
    return NextResponse.redirect(new URL(role ? ROLE_HOME[role] : '/', request.url));
  }

  // Patients/students must complete HIPAA consent before reaching /portal or
  // /student. Provider/staff/admin accounts are created internally and are
  // exempt (they never hold patient PHI consent obligations themselves).
  if ((match.prefix === '/portal' || match.prefix === '/student') &&
      !request.nextUrl.pathname.startsWith(`${match.prefix}/onboarding`)) {
    const { data: pendingConsent } = await supabase.rpc('has_pending_consent' as never);
    if (pendingConsent) {
      return NextResponse.redirect(new URL(`${match.prefix}/onboarding/consent`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/portal/:path*', '/provider/:path*', '/student/:path*', '/admin/:path*'],
};
