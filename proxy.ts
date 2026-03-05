import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = '__dost_session';

const AUTH_PAGES = ['/', '/signup', '/forgot-password'];

function isPublic(pathname: string): boolean {
  if (AUTH_PAGES.includes(pathname)) return true;
  if (pathname.startsWith('/view-doc')) return true;
  if (pathname.startsWith('/api/auth/')) return true;
  if (pathname.startsWith('/api/view-doc/')) return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/icons')) return true;
  if (pathname === '/favicon.ico') return true;
  if (/\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|otf|mp4|webm|pdf)$/i.test(pathname)) return true;
  if (pathname === '/sw.js') return true;
  if (pathname === '/manifest.webmanifest') return true;
  return false;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  // Logged-in users cannot access auth pages
  if (token && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Public paths pass through — but prevent BFCache on auth pages
  if (isPublic(pathname)) {
    const res = NextResponse.next();
    if (AUTH_PAGES.includes(pathname)) {
      res.headers.set('Cache-Control', 'no-store');
    }
    return res;
  }

  // No token → block access
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons).*)'],
};
