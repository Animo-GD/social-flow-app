export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createPaymobPaymentKey } from '@/lib/paymob';
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
    .single();

  if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

  // Paymob amounts are in cents
  // We'll use a fixed USD to EGP rate (e.g. 1 USD = 50 EGP) or handle prices directly
  // For this implementation, we assume price_usd is the base and we multiply for EGP
  const amountInCents = Math.round(pkg.price_usd * 50 * 100); 

  try {
    const paymentKey = await createPaymobPaymentKey({
      amount_cents: amountInCents,
      package_name: `${pkg.name} — ${pkg.credits} Credits`,
      integration_id: parseInt(process.env.PAYMOB_INSTAPAY_INTEGRATION_ID || '0', 10),
      user: {
        id: session.id,
        email: session.email,
        name: session.name || 'User',
      },
    });

    // Paymob Iframe URL
    const iframeId = process.env.PAYMOB_IFRAME_ID;
    const checkoutUrl = `https://egypt.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;

    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    console.error('Paymob checkout error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
