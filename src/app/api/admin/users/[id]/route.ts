import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/admin';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, ctx: Ctx) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: 'User id is required' }, { status: 400 });
  }

  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
