import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side admin operations');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const supabaseAdmin = (() => {
  if (!supabaseUrl || !serviceRoleKey) {
    // Return a proxy that throws on first use rather than at module load
    return new Proxy({} as ReturnType<typeof createClient>, {
      get() {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side admin operations');
      },
    });
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
})();
