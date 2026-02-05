import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPrefixes = ['/login', '/api/auth'];
const publicExactPaths = ['/', '/features', '/how-it-works'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (
    publicExactPaths.includes(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  // Check for session cookie from BetterAuth
  const sessionCookie = request.cookies.get('better-auth.session_token');

  // If no session and trying to access protected route, redirect to login
  if (!sessionCookie && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
