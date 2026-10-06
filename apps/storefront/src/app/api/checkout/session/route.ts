/**
 * Server API Route: POST /api/checkout/session
 * Creates an authoritative Stripe Embedded Checkout Session with D1 inventory reservation.
 * Compliant with: PAY-01, INV-01, INV-02, INV-06, MYS-03, MYS-05
 */

import { createStripeClient, createEmbeddedCheckoutSession } from '@beadsily/payments';

export async function POST(request: Request, context: { env?: any }) {
  try {
    const body = await request.json();
    const env = context?.env || process.env;
    const db = env?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'DATABASE_UNAVAILABLE: D1 binding missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stripeKey = env?.STRIPE_SECRET_KEY || 'sk_test_mock_beadsily';
    const stripeClient = createStripeClient(stripeKey);

    const result = await createEmbeddedCheckoutSession({
      db,
      stripeClient,
      cart: body.cart,
      customerEmail: body.customerEmail,
      shippingAddress: body.shippingAddress,
      origin: new URL(request.url).origin,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const status = err.message?.startsWith('INSUFFICIENT_STOCK') ? 409
      : err.message?.startsWith('MYSTERY_BOX_SOLD_OUT') ? 409
      : err.message?.startsWith('VALIDATION_ERROR') ? 400
      : 500;

    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
