/**
 * Paymob client for Egyptian payments (Cards, Wallets)
 * Docs: https://docs.paymob.com/
 */

const PAYMOB_BASE_URL = 'https://egypt.paymob.com/api';

/**
 * Step 1: Authentication
 */
async function authenticate() {
  const apiKey = process.env.PAYMOB_API_KEY;
  if (!apiKey) throw new Error('PAYMOB_API_KEY is missing');

  const res = await fetch(`${PAYMOB_BASE_URL}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });

  if (!res.ok) throw new Error(`Paymob Auth failed: ${await res.text()}`);
  const data = await res.json();
  return data.token;
}

/**
 * Step 2: Order Registration
 */
async function registerOrder(token: string, amount_cents: number, package_name: string) {
  const res = await fetch(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: token,
      delivery_needed: false,
      amount_cents: amount_cents,
      currency: 'EGP',
      items: [{ name: package_name, amount_cents: amount_cents, quantity: 1 }],
    }),
  });

  if (!res.ok) throw new Error(`Paymob Order failed: ${await res.text()}`);
  const data = await res.json();
  return data.id;
}

/**
 * Step 3: Payment Key Generation
 */
export async function createPaymobPaymentKey(opts: {
  amount_cents: number;
  package_name: string;
  user: { email: string; name: string; phone?: string; id: string };
  integration_id: number;
}) {
  const token = await authenticate();
  const orderId = await registerOrder(token, opts.amount_cents, opts.package_name);

  const res = await fetch(`${PAYMOB_BASE_URL}/acceptance/payment_keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: token,
      amount_cents: opts.amount_cents,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        apartment: 'NA',
        email: opts.user.email,
        floor: 'NA',
        first_name: opts.user.name.split(' ')[0] || 'User',
        street: 'NA',
        building: 'NA',
        phone_number: opts.user.phone || '01234567890', // Default if missing
        shipping_method: 'NA',
        postal_code: 'NA',
        city: 'NA',
        country: 'EG',
        last_name: opts.user.name.split(' ')[1] || 'NA',
        state: 'NA',
      },
      currency: 'EGP',
      integration_id: opts.integration_id,
      lock_order_when_paid: false,
    }),
  });

  if (!res.ok) throw new Error(`Paymob Payment Key failed: ${await res.text()}`);
  const data = await res.json();
  return data.token;
}
