import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, contact_name, platform, last_message, unread_count, updated_at')
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
