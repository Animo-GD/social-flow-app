import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('messages')
    .select('id, sender, text, rag_context, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const mapped = data.map(m => ({
    id: m.id,
    sender: m.sender,
    text: m.text,
    rag_context: m.rag_context,
    timestamp: m.created_at,
  }));

  return NextResponse.json(mapped);
}
