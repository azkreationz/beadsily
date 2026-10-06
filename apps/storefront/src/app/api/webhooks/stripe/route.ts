/**
 * Server API Route: POST /api/webhooks/stripe
 * Ingests Stripe webhook events with HMAC signature verification, D1 two-phase persistence,
 * and idempotent replay deduplication.
 * Compliant with: PAY-03, PAY-04
 */

import { handleStripeWebhookEvent } from '@beadsily/payments';

export async function POST(request: Request, context: { env?: any }) {
  const signatureHeader = request.headers.get('stripe-signature');
  if (!signatureHeader) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await request.text();
  const env = context?.env || process.env;
  const db = env?.DB;

  if (!db) {
    return new Response(JSON.stringify({ error: 'DATABASE_UNAVAILABLE: D1 binding missing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const webhookSecret = env?.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_for_beadsily_crypto_verification_987';

  try {
    const outcome = await handleStripeWebhookEvent({
      db,
      rawBody,
      signatureHeader,
      secret: webhookSecret,
    });

    return new Response(JSON.stringify(outcome), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const status = err.message?.includes('SIGNATURE_VERIFICATION_FAILED') ? 400 : 500;
    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
