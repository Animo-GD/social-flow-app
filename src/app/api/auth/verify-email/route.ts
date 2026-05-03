import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    // Find valid OTP
    const { data: otp } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!otp) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    // Mark OTP as used
    await supabase.from('email_verifications').update({ used: true }).eq('id', otp.id);

    // Mark user as verified
    const { data: user } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('email', email.toLowerCase())
      .select('id, name, email, is_admin')
      .single();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Create session
    await createSession({
      id: user.id,
      name: user.name ?? user.email,
      email: user.email,
      isAdmin: user.is_admin ?? false
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
