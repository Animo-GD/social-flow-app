import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? 'sf-dev-secret-change-in-production'
);
const COOKIE = 'sf_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const COOKIE_SECURE =
  process.env.SESSION_COOKIE_SECURE === 'true'
    ? true
    : process.env.SESSION_COOKIE_SECURE === 'false'
      ? false
      : process.env.NODE_ENV === 'production';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

// ── Sign & set cookie ─────────────────────────────────────────────
export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
    secure: COOKIE_SECURE,
  });
}

// ── Read & verify cookie ──────────────────────────────────────────
export async function getSession(): Promise<SessionUser | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

// ── Delete cookie ─────────────────────────────────────────────────
export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
