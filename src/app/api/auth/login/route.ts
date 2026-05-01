import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSession, clearSession, getSession } from '@/lib/session';

// POST /api/auth/login
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  // 1. Look up the user row in the users table by email (always)
  const { data: userRow } = await supabase
    .from('users')
    .select('id, name, email, password_hash')
    .eq('email', email)
    .single();

  // 2. Demo shortcut — bypass bcrypt for demo credentials
  const isDemoLogin = email === 'admin@socialflow.ai' && password === 'demo';

  if (!userRow) {
    if (isDemoLogin) {
      // Demo user not in DB yet — create a fallback session with a stable fake ID
      await createSession({ id: 'demo', name: 'Admin', email });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!isDemoLogin) {
    // 3. Real password check via pgcrypto RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('verify_user_password', {
      p_email: email,
      p_password: password,
    });
    if (rpcError || !rpcData || rpcData.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  }

  // 4. Store real UUID from users table in the session
  await createSession({
    id:    userRow.id,
    name:  userRow.name ?? 'User',
    email: userRow.email,
  });
  return NextResponse.json({ ok: true });
}

// DELETE /api/auth/login  → logout
export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}

// GET /api/auth/login → get current session (used by layout)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({ user: session });
}
