import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: NextRequest) {
  const { language } = await req.json();
  if (!['en', 'ar'].includes(language)) {
    return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
  }

  // In production this would use the session user ID; for now update the demo user
  const { error } = await supabase
    .from('users')
    .update({ preferred_language: language })
    .eq('email', 'admin@socialflow.ai');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
