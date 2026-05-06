import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .order('price_usd', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.id) {
    return NextResponse.json({ error: 'Invalid payload: package id is required' }, { status: 400 });
  }

  const updates: any = {};
  if (body.price_usd !== undefined) updates.price_usd = Number(body.price_usd);
  if (body.paymob_url !== undefined) updates.paymob_url = body.paymob_url;
  if (body.credits !== undefined) updates.credits = Number(body.credits);
  if (body.name !== undefined) updates.name = body.name;

  const { data, error } = await supabase
    .from('credit_packages')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
