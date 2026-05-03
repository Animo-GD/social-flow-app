import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendVerificationEmail } from '@/lib/email';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const { data: user } = await supabase
    .from('users')
    .select('id, preferred_language, email_verified')
    .eq('email', email.toLowerCase())
    .single();

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.email_verified) return NextResponse.json({ error: 'Already verified' }, { status: 400 });

  // Rate-limit: only allow resend once per minute
  const { data: recent } = await supabaseAdmin
    .from('email_verifications')
    .select('created_at')
    .eq('email', email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recent && new Date(recent.created_at).getTime() > Date.now() - 60_000) {
    return NextResponse.json({ error: 'Please wait 1 minute before requesting another code' }, { status: 429 });
  }

  await supabaseAdmin.from('email_verifications').delete().eq('email', email.toLowerCase());

  const code = generateCode();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await supabaseAdmin.from('email_verifications').insert({ email: email.toLowerCase(), code, expires_at });
  await sendVerificationEmail(email, code, user.preferred_language as 'en' | 'ar' ?? 'en');

  return NextResponse.json({ ok: true });
}
