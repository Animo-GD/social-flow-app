import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// One-time setup route — call GET /api/setup once, then delete this file
export async function GET() {
  // Create generation_jobs table via raw SQL
  const { error } = await supabase.rpc('exec_ddl', {
    sql: `
      CREATE TABLE IF NOT EXISTS generation_jobs (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        status     TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','completed','failed')),
        result     JSONB,
        error_msg  TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
    `,
  });

  if (error) {
    // Table likely already exists or no exec_ddl — try a direct insert/select to verify
    const { error: e2 } = await supabase.from('generation_jobs').select('id').limit(1);
    if (e2) return NextResponse.json({ error: e2.message, hint: 'Run the SQL in Supabase Dashboard' });
    return NextResponse.json({ ok: true, note: 'Table already exists' });
  }

  return NextResponse.json({ ok: true });
}
