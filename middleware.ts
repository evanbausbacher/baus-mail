import { NextResponse } from 'next/server';
import { auth } from './auth';

const PUBLIC_PATHS = [
  '/api/auth',
  '/api/webhooks/resend',
  '/favicon.ico',
  '/apple-touch-icon.png',
];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    pathname.startsWith('/_next/') ||
    pathname.match(/\.(?:png|jpg|jpeg|gif|svg|ico|css|js|webmanifest)$/)
  );
}

export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!request.auth?.user?.email) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const signInUrl = new URL('/api/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
