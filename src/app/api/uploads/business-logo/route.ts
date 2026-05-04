import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG, JPG, WEBP, and SVG are allowed' }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File size must be under 5 MB' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${session.id}/logo.${ext}`;

  // Upsert — overwrite previous logo
  const { error } = await supabaseAdmin.storage.from('images').upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from('images').getPublicUrl(path);

  // Add cache-busting so the UI updates immediately
  const cacheBustedUrl = `${data.publicUrl}?v=${Date.now()}`;

  return NextResponse.json({ url: cacheBustedUrl, path });
}
