export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { text, image_url, platform, publish_at, product_notes } = body;
  const normalizedPublishAt =
    typeof publish_at === 'string' && publish_at.trim().length > 0 ? publish_at : null;
  const status = normalizedPublishAt ? 'scheduled' : 'draft';

  const { data, error } = await supabase
    .from('posts')
    .insert({ text, image_url, platform, publish_at: normalizedPublishAt, status, user_id: session.id, product_notes })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
