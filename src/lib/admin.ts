import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

const DEFAULT_ADMINS = new Set(['admin@socialflow.ai', 'moaaz@gmail.com']);

export async function requireAdminSession() {
  const session = await getSession();
  if (!session) return null;

  // Check session flag first (fast path)
  if (session.isAdmin) return session;

  // Fallback: check DB
  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', session.id)
    .single();

  if (data?.is_admin) return session;

  // Fallback: check env ADMIN_EMAILS
  const configured = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  const adminEmails = new Set(configured.length ? configured : Array.from(DEFAULT_ADMINS));
  const email = session.email.toLowerCase();
  if (!adminEmails.has(email)) return null;

  return session;
}
