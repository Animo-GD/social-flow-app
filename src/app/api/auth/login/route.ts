import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSession, clearSession, getSession } from '@/lib/session';
import { isAppHash, verifyPassword } from '@/lib/password';

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
    const { data: userRow } = await supabase
      .from('users')
      .select('id, name, email, password_hash, is_admin, email_verified')
      .eq('email', email)
      .single();

    const isDemo = email === 'admin@socialflow.ai' && password === 'demo';

    if (!userRow) {
      if (isDemo) {
        await createSession({ id: 'demo', name: 'Admin', email, isAdmin: true });
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!userRow.email_verified && !isDemo) {
      return NextResponse.json({ error: 'unverified', message: 'Please verify your email to log in.' }, { status: 403 });
    }

    if (!isDemo) {
      const storedHash = String(userRow.password_hash ?? '');

      if (isAppHash(storedHash)) {
        if (!verifyPassword(password, storedHash)) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
      } else {
      const { data: rpcData, error: rpcError } = await supabase.rpc('verify_user_password', {
        p_email: email,
        p_password: password,
      });
        const rpcValid = !rpcError && Array.isArray(rpcData) && rpcData.length > 0;
        const fallbackValid = storedHash.length > 0 && storedHash === password;

        if (!rpcValid && !fallbackValid) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
      }
    }

    await createSession({
      id: userRow.id,
      name: userRow.name ?? 'User',
      email: userRow.email,
      isAdmin: userRow.is_admin ?? false,
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
