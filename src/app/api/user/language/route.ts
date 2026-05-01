import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { language } = await req.json();
  if (!['en', 'ar'].includes(language)) {
    return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
  }

  const { error } = await supabase
    .from('users')
    .update({ preferred_language: language })
    .eq('id', session.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
