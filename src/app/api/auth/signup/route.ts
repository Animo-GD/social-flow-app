import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { hashPassword } from '@/lib/password';
import { sendVerificationEmail } from '@/lib/email';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/signup — Step 1: create user + send OTP
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const username = String(body?.username ?? '').trim();
    const password = String(body?.password ?? '');
    const phone = String(body?.phone ?? '').trim();
    const preferred_language = ['en', 'ar'].includes(body?.preferred_language) ? body.preferred_language : 'en';

    // Validation
    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Email, username and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json({ error: 'Username must be 3-30 characters, letters/numbers/underscore only' }, { status: 400 });
    }

    // Check uniqueness
    const { data: existingEmail } = await supabase.from('users').select('id, email_verified').eq('email', email).single();
    if (existingEmail && existingEmail.email_verified) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const { data: existingUsername } = await supabase.from('users').select('id, email').eq('username', username).single();
    if (existingUsername && existingUsername.email !== email) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    let userId = existingEmail?.id;

    if (existingEmail && !existingEmail.email_verified) {
      // Update existing unverified user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username,
          name: username,
          password_hash: hashPassword(password),
          phone: phone || null,
          preferred_language,
        })
        .eq('id', existingEmail.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      // Create new user (unverified)
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email,
          username,
          name: username,
          password_hash: hashPassword(password),
          phone: phone || null,
          preferred_language,
          email_verified: false,
          credits: 0,
          is_admin: false,
        })
        .select('id')
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
      userId = newUser.id;
    }

    // Delete any old OTP codes for this email
    await supabaseAdmin.from('email_verifications').delete().eq('email', email);

    // Create OTP
    const code = generateCode();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    await supabaseAdmin.from('email_verifications').insert({ email, code, expires_at });

    // Send email
    await sendVerificationEmail(email, code, preferred_language as 'en' | 'ar');

    return NextResponse.json({ ok: true, userId });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
