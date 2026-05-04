export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getMoyasarPayment } from '@/lib/moyasar';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/webhooks/moyasar/callback
 *
 * Moyasar redirects the user back here after payment (success or failure).
 * Query params: id (payment ID), status, message, userId, packageId, credits
 *
 * We NEVER trust client-passed status — we always verify server-side via Moyasar API.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const paymentId = searchParams.get('id');
  const userId = searchParams.get('userId');
  const credits = searchParams.get('credits');
  const packageId = searchParams.get('packageId');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!paymentId || !userId || !credits) {
    return NextResponse.redirect(`${appUrl}/dashboard/credits?error=missing_params`);
  }

  try {
    // Verify payment status server-side — never trust client-reported status
    const payment = await getMoyasarPayment(paymentId);

    if (payment.status !== 'paid') {
      console.error(`Moyasar payment ${paymentId} status: ${payment.status}`);
      return NextResponse.redirect(`${appUrl}/dashboard/credits?cancelled=1`);
    }

    const creditsToAdd = parseInt(credits, 10);
    if (isNaN(creditsToAdd) || creditsToAdd <= 0) {
      return NextResponse.redirect(`${appUrl}/dashboard/credits?error=invalid_credits`);
    }

    // Check for duplicate processing (idempotency)
    const { data: existing } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('stripe_session_id', paymentId) // reusing the column for moyasar payment id
      .single();

    if (!existing) {
      // Add credits to user
      const { data: user } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      await supabase
        .from('users')
        .update({ credits: (user?.credits ?? 0) + creditsToAdd })
        .eq('id', userId);

      // Record transaction
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: creditsToAdd,
        type: 'purchase',
        description: `Purchased ${creditsToAdd} credits via Moyasar`,
        stripe_session_id: paymentId, // reusing column to store Moyasar payment ID
      });
    }

    return NextResponse.redirect(`${appUrl}/dashboard/credits?success=1`);
  } catch (err) {
    console.error('Moyasar callback error:', err);
    return NextResponse.redirect(`${appUrl}/dashboard/credits?error=verification_failed`);
  }
}

/**
 * POST /api/webhooks/moyasar/callback
 *
 * Moyasar webhook for server-to-server notifications (payment_paid event).
 * Configure this in: Moyasar Dashboard → Settings → Webhooks
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify webhook signature if MOYASAR_WEBHOOK_SECRET is configured
    const webhookSecret = process.env.MOYASAR_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers.get('x-moyasar-signature');
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
      }
      // Simple HMAC-SHA256 verification
      const crypto = await import('crypto');
      const payload = JSON.stringify(body);
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');
      if (signature !== expected) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    if (body.type === 'payment_paid') {
      const payment = body.data;
      const { userId, credits } = payment.metadata ?? {};

      if (!userId || !credits) {
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      const creditsToAdd = parseInt(credits, 10);

      // Idempotency check
      const { data: existing } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('stripe_session_id', payment.id)
        .single();

      if (!existing) {
        const { data: user } = await supabase
          .from('users')
          .select('credits')
          .eq('id', userId)
          .single();

        await supabase
          .from('users')
          .update({ credits: (user?.credits ?? 0) + creditsToAdd })
          .eq('id', userId);

        await supabase.from('credit_transactions').insert({
          user_id: userId,
          amount: creditsToAdd,
          type: 'purchase',
          description: `Purchased ${creditsToAdd} credits via Moyasar`,
          stripe_session_id: payment.id,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Moyasar webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
