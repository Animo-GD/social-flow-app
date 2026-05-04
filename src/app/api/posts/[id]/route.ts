export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
    .eq('user_id', session.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  let nextStatus: string | null = null;

  const updates: Record<string, unknown> = {};
  if (typeof body.text === 'string') updates.text = body.text;
  if (typeof body.image_url === 'string' || body.image_url === null) updates.image_url = body.image_url;
  if (typeof body.product_notes === 'string') updates.product_notes = body.product_notes;
  if (typeof body.publish_at === 'string') {
    const normalizedPublishAt = body.publish_at.trim() ? body.publish_at : null;
    updates.publish_at = normalizedPublishAt;
    nextStatus = normalizedPublishAt ? 'scheduled' : 'draft';
  } else if (body.publish_at === null) {
    updates.publish_at = null;
    nextStatus = 'draft';
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  if (nextStatus) {
    const { data: current } = await supabase
      .from('posts')
      .select('status')
      .eq('id', id)
      .eq('user_id', session.id)
      .single();

    if (current && current.status !== 'posted' && current.status !== 'failed') {
      updates.status = nextStatus;
    }
  }

  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', session.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
