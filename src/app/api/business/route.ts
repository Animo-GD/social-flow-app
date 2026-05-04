export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

// GET /api/business — fetch the current user's business profile
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('business')
    .select('*')
    .eq('user_id', session.id)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {  // PGRST116 = no rows
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? null);
}

// POST /api/business — create or update (upsert)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Remove id if present — let the DB own it
  const { id: _id, user_id: _uid, created_at: _ca, ...fields } = body;

  const payload = {
    ...fields,
    user_id:    session.id,
    is_active:  true,
    updated_at: new Date().toISOString(),
  };

  // Try update first, then insert
  const { data: existing } = await supabase
    .from('business')
    .select('id')
    .eq('user_id', session.id)
    .eq('is_active', true)
    .single();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from('business')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  } else {
    const { data, error } = await supabase
      .from('business')
      .insert(payload)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  }

  return NextResponse.json(result);
}

// PATCH /api/business — partial update (e.g. add one example post)
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const { data: existing } = await supabase
    .from('business')
    .select('id')
    .eq('user_id', session.id)
    .eq('is_active', true)
    .single();

  if (!existing) return NextResponse.json({ error: 'No business profile found' }, { status: 404 });

  const { data, error } = await supabase
    .from('business')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
