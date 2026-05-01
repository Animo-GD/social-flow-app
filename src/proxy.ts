import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? 'sf-dev-secret-change-in-production'
);

const PUBLIC_PREFIXES = ['/login', '/api/auth', '/api/health', '/_next', '/favicon'];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Some clients/extensions can issue non-GET verbs to /login.
  // Avoid 405 on the page route and keep login UX responsive.
  if (pathname === '/login' && req.method !== 'GET' && req.method !== 'HEAD') {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Allow public paths
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Verify session cookie
  const token = req.cookies.get('sf_session')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete('sf_session');
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
