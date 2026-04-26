import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const PUBLIC_PATHS = ['/', '/signup', '/forgot-password', '/view-doc'];

// Routes that a logged-in user should not access (redirect to dashboard)
const AUTH_ONLY_PATHS = ['/', '/signup', '/forgot-password'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(p =>
    pathname === p || pathname.startsWith(p + '/')
  );
}

function isAuthOnly(pathname: string): boolean {
  return AUTH_ONLY_PATHS.some(p =>
    pathname === p || pathname.startsWith(p + '/')
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/public') ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get('auth-token')?.value;
  const isLoggedIn = !!authToken;

  // If logged in and trying to access login/signup — redirect to dashboard
  if (isLoggedIn && isAuthOnly(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If not logged in and trying to access a protected route — redirect to login
  if (!isLoggedIn && !isPublic(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)).*)',
  ],
};
