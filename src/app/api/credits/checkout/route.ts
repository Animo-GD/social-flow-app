export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createMoyasarPayment } from '@/lib/moyasar';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { packageId } = await req.json();
  if (!packageId) return NextResponse.json({ error: 'Package ID required' }, { status: 400 });

  const { data: pkg } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('id', packageId)
    .eq('is_active', true)
    .single();

  if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Moyasar amounts are in halalas (SAR × 100)
  // We convert USD price to SAR using a fixed rate (update as needed)
  // Or if you set price_usd as SAR prices, just multiply by 100
  const amountInHalalas = Math.round(pkg.price_usd * 100);

  try {
    const payment = await createMoyasarPayment({
      amount: amountInHalalas,
      currency: 'SAR',
      description: `${pkg.name} — ${pkg.credits} Credits`,
      callback_url: `${appUrl}/api/webhooks/moyasar/callback?userId=${session.id}&packageId=${pkg.id}&credits=${pkg.credits}`,
      metadata: {
        userId: session.id,
        packageId: pkg.id,
        credits: pkg.credits.toString(),
        userEmail: session.email,
      },
    });

    // The transaction_url is where we redirect the user to complete payment
    const redirectUrl = payment.source?.transaction_url;

    if (!redirectUrl) {
      return NextResponse.json({ error: 'No redirect URL from Moyasar' }, { status: 500 });
    }

    return NextResponse.json({ url: redirectUrl, paymentId: payment.id });
  } catch (err) {
    console.error('Moyasar checkout error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
