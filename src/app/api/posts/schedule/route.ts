import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text, image_url, platform, publish_at } = body;

  const { data, error } = await supabase
    .from('posts')
    .insert({ text, image_url, platform, publish_at, status: 'scheduled' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
