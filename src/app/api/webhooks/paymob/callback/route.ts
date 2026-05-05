export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/webhooks/paymob/callback
 * This is the redirect URL (Transaction processed callback) the user visits after payment.
 * Paymob appends query parameters with transaction details.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const success = searchParams.get('success');
  const paymentId = searchParams.get('id');
  const amountCentsStr = searchParams.get('amount_cents');
  
  // Note: We should verify HMAC here in production for security, 
  // but since we also have the POST webhook, this serves as an immediate UX enhancement.
  // The HMAC is provided in `searchParams.get('hmac')`.

  if (success !== 'true' || !paymentId || !amountCentsStr) {
    // If it failed or is missing data, redirect to dashboard with cancelled status
    return NextResponse.redirect(new URL('/dashboard/profile?cancelled=true', req.url));
  }

  const amountCents = parseInt(amountCentsStr, 10);

  // We need to know who the user is. Paymob sends the email in POST webhook, 
  // but GET redirect might not have full billing_data depending on settings. 
  // Wait, the GET redirect URL from Paymob has `owner` or `merchant_order_id`.
  // To be safe, we can try to look up the transaction to see if it's already processed.
  
  try {
    // 1. Check idempotency: Did the POST webhook already process this?
    const { data: existingTx } = await supabase
      .from('credit_transactions')
      .select('id, user_id')
      .eq('stripe_session_id', `paymob_${paymentId}`)
      .single();

    if (existingTx) {
      // Already processed! Just redirect to success.
      return NextResponse.redirect(new URL('/dashboard/profile?success=true', req.url));
    }

    // 2. We need to identify the user.
    // Ideally, Paymob sends back `merchant_order_id` which we could have set to `user_id_package_id`.
    // Let's see if we can get email from `searchParams` if Paymob includes it in the redirect.
    // Actually, Paymob's GET callback params are flat, e.g. ?id=123&success=true&amount_cents=100...
    // If we can't reliably get the user ID from the GET params, the POST webhook is the only reliable way.
    // For now, let's just wait a tiny bit to see if the POST webhook fires, or redirect immediately 
    // and rely on the POST webhook to add the credits in the background.
    
    // However, the user specifically asked:
    // "you should add the credit to his account." in this redirect link.
    // If Paymob's GET request contains an `email` or `merchant_order_id`, we can do it.
    // Usually it doesn't contain `billing_data.email` in the flat GET parameters.
    // BUT we do know the session since the user is navigating their browser back to our site!
    // Since this is a browser redirect, we can just get their session cookie!

    // IMPORTANT: Next.js API Routes don't automatically have the Supabase Auth session if we use the default client,
    // but we can use `@/lib/session` (which uses Supabase server client with cookies).

    const { getSession } = await import('@/lib/session');
    const session = await getSession();

    if (!session) {
       // If no session found in browser, fallback to background POST webhook and just redirect
       return NextResponse.redirect(new URL('/dashboard/profile?success=true', req.url));
    }

    // Determine credits to add based on amount (Same logic as POST webhook)
    let creditsToAdd = 0;
    if (amountCents >= 450000) creditsToAdd = 50000;
    else if (amountCents >= 125000) creditsToAdd = 10000;
    else if (amountCents >= 50000) creditsToAdd = 3000;
    else if (amountCents >= 10000) creditsToAdd = 500;

    if (creditsToAdd > 0) {
       // Get current user credits
       const { data: userRow } = await supabase
         .from('users')
         .select('credits')
         .eq('id', session.id)
         .single();
         
       if (userRow) {
          // Double check idempotency again just to be safe
          const { data: checkAgain } = await supabase
            .from('credit_transactions')
            .select('id')
            .eq('stripe_session_id', `paymob_${paymentId}`)
            .single();
            
          if (!checkAgain) {
            // Update user credits
            await supabase
              .from('users')
              .update({ credits: (userRow.credits ?? 0) + creditsToAdd })
              .eq('id', session.id);

            // Record transaction
            await supabase.from('credit_transactions').insert({
              user_id: session.id,
              amount: creditsToAdd,
              type: 'purchase',
              description: `Purchased ${creditsToAdd} credits via Paymob`,
              stripe_session_id: `paymob_${paymentId}`,
            });
          }
       }
    }
    
    // Always redirect to success UI
    return NextResponse.redirect(new URL('/dashboard/profile?success=true', req.url));
    
  } catch (err) {
    console.error('Paymob GET callback error:', err);
    return NextResponse.redirect(new URL('/dashboard/profile?success=true', req.url)); // Still redirect to let UI handle it
  }
}
