import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('conversations')
    .select('id, contact_name, platform, last_message, unread_count, updated_at')
    .eq('user_id', session.id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map DB column names to frontend interface shape
  const mapped = data.map(c => ({
    id: c.id,
    user: c.contact_name,
    platform: c.platform,
    last_message: c.last_message,
    timestamp: c.updated_at,
    unread: c.unread_count,
  }));

  return NextResponse.json(mapped);
}
