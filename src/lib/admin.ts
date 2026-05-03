import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

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

  return null;
}
