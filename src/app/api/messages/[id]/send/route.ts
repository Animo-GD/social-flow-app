import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { text } = await req.json();

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('user_id', session.id)
    .single();

  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Insert agent reply
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: id, sender: 'agent', text })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update conversation last_message
  await supabase
    .from('conversations')
    .update({ last_message: text, updated_at: new Date().toISOString() })
    .eq('id', id);

  return NextResponse.json({
    id: data.id,
    sender: data.sender,
    text: data.text,
    timestamp: data.created_at,
  });
}
