export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    // Find valid OTP
    const { data: otp } = await supabaseAdmin
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
    await supabaseAdmin.from('email_verifications').update({ used: true }).eq('id', otp.id);

    // Fetch current user state to check credits
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('id, credits')
      .eq('email', email.toLowerCase())
      .single();

    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isFirstTime = currentUser.credits === 0;
    const creditsToAdd = isFirstTime ? 2000 : 0;

    // Mark user as verified and add credits
    const { data: user } = await supabaseAdmin
      .from('users')
      .update({ 
        email_verified: true,
        credits: currentUser.credits + creditsToAdd
      })
      .eq('id', currentUser.id)
      .select('id, name, email, is_admin')
      .single();

    if (!user) return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });

    // Record the transaction if credits were added
    if (creditsToAdd > 0) {
      await supabaseAdmin.from('credit_transactions').insert({
        user_id: user.id,
        amount: creditsToAdd,
        type: 'bonus',
        description: 'Welcome Bonus: 2000 Free Credits!',
      });
    }

    // Create session
    await createSession({
      id: user.id,
      name: user.name ?? user.email,
      email: user.email,
      isAdmin: user.is_admin ?? false
    });

    const res = NextResponse.json({ ok: true });

    // Set a cookie so the frontend knows to show the welcome popup
    if (creditsToAdd > 0) {
      res.cookies.set('welcome_bonus', '1', { path: '/', maxAge: 60 }); // 1 minute is enough to be read once
    }

    return res;
  } catch (err) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
