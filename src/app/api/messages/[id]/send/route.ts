import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { text } = await req.json();

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
