// NextAuth stub — kept so old /api/auth/... links don't 404
// Real auth is now handled by /api/auth/login
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  // Handle sign-out redirect from sidebar link
  if (url.pathname.includes('signout')) {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete('sf_session');
    return res;
  }
  return NextResponse.json({ error: 'Use /api/auth/login' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: 'Use /api/auth/login' }, { status: 404 });
}
