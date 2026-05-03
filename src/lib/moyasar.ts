// Moyasar payment client
// Docs: https://docs.moyasar.com

export const MOYASAR_API_URL = 'https://api.moyasar.com/v1';

/**
 * Create a Moyasar payment session (Payment Request API)
 * Amount must be in halalas (SAR × 100)
 */
export async function createMoyasarPayment(opts: {
  amount: number;          // in halalas (SAR * 100)
  currency: string;        // 'SAR'
  description: string;
  callback_url: string;
  metadata?: Record<string, string>;
}) {
  const secretKey = process.env.MOYASAR_SECRET_KEY!;

  const body = {
    amount: opts.amount,
    currency: opts.currency,
    description: opts.description,
    callback_url: opts.callback_url,
    source: { type: 'creditcard' },
    metadata: opts.metadata ?? {},
  };

  const res = await fetch(`${MOYASAR_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Moyasar API error ${res.status}: ${err}`);
  }

  return res.json() as Promise<MoyasarPayment>;
}

/**
 * Fetch a payment by ID to verify status server-side
 */
export async function getMoyasarPayment(paymentId: string): Promise<MoyasarPayment> {
  const secretKey = process.env.MOYASAR_SECRET_KEY!;

  const res = await fetch(`${MOYASAR_API_URL}/payments/${paymentId}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Moyasar API error ${res.status}: ${err}`);
  }

  return res.json();
}

export interface MoyasarPayment {
  id: string;
  status: 'initiated' | 'paid' | 'failed' | 'authorized' | 'captured' | 'refunded' | 'voided';
  amount: number;
  currency: string;
  description: string;
  callback_url: string;
  metadata: Record<string, string>;
  source: {
    type: string;
    transaction_url?: string; // redirect URL for hosted payment
  };
  created_at: string;
}
