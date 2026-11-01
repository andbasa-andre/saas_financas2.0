import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check authentication status from cookies
  // - 'fin_auth_session' (synchronized by localStorage contingency mode and client session)
  // - Supabase auth cookies (starts with 'sb-' and contains '-auth-token')
  const allCookies = request.cookies.getAll();
  const hasLocalSession = request.cookies.get('fin_auth_session')?.value === '1';
  const hasSupabaseSession = allCookies.some(
    cookie => cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  );

  const isAuthenticated = hasLocalSession || hasSupabaseSession;

  // 2. Define route matchers
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding');
  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  // 3. Unauthenticated user trying to access protected routes -> redirect to /login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Authenticated user trying to access auth pages -> redirect to /dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/login',
    '/register',
    '/forgot-password'
  ]
};
