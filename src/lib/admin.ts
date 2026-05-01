import { getSession } from '@/lib/session';

const DEFAULT_ADMINS = new Set(['admin@socialflow.ai', 'moaaz@gmail.com']);

export async function requireAdminSession() {
  const session = await getSession();
  if (!session) return null;

  const configured = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  const adminEmails = new Set(configured.length ? configured : Array.from(DEFAULT_ADMINS));
  const email = session.email.toLowerCase();
  if (!adminEmails.has(email)) return null;

  return session;
}
