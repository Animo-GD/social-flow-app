import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSession, clearSession, getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ user: session });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Look up user
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id, name, email, password_hash')
      .eq('email', email)
      .single();

    const isDemo = email === 'admin@socialflow.ai' && password === 'demo';

    if (!userRow) {
      if (isDemo) {
        await createSession({ id: 'demo', name: 'Admin', email });
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!isDemo) {
      const { data: rpcData, error: rpcError } = await supabase.rpc('verify_user_password', {
        p_email: email,
        p_password: password,
      });
      if (rpcError || !rpcData || rpcData.length === 0) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    await createSession({
      id: userRow.id,
      name: userRow.name ?? 'User',
      email: userRow.email,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
