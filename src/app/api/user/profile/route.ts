import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { hashPassword, verifyPassword, isAppHash } from '@/lib/password';

export const dynamic = 'force-dynamic';

// GET /api/user/profile
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('users')
    .select('id, name, username, email, phone, preferred_language, avatar_url, credits, is_admin, created_at, email_verified')
    .eq('id', session.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/user/profile
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  // Username
  if (typeof body.username === 'string') {
    const username = body.username.trim();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json({ error: 'Username must be 3-30 characters, letters/numbers/underscore only' }, { status: 400 });
    }
    // Check uniqueness (exclude self)
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', session.id)
      .single();
    if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    updates.username = username;
    updates.name = username;
  }

  // Phone
  if (typeof body.phone === 'string') {
    updates.phone = body.phone.trim() || null;
  }

  // Preferred language
  if (['en', 'ar'].includes(body.preferred_language)) {
    updates.preferred_language = body.preferred_language;
  }

  // Avatar URL (set after upload)
  if (typeof body.avatar_url === 'string' || body.avatar_url === null) {
    updates.avatar_url = body.avatar_url;
  }

  // Password change
  if (body.current_password && body.new_password) {
    if (String(body.new_password).length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }
    // Verify current password
    const { data: userRow } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', session.id)
      .single();

    const stored = String(userRow?.password_hash ?? '');
    const valid = isAppHash(stored)
      ? verifyPassword(String(body.current_password), stored)
      : stored === String(body.current_password);

    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }
    updates.password_hash = hashPassword(String(body.new_password));
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', session.id)
    .select('id, name, username, email, phone, preferred_language, avatar_url, credits')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
