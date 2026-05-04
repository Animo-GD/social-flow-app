export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('users')
    .select('credits')
    .eq('id', session.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: history } = await supabase
    .from('credit_transactions')
    .select('id, amount, type, description, created_at')
    .eq('user_id', session.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ credits: data?.credits ?? 0, history: history ?? [] });
}
