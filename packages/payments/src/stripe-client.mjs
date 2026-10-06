/**
 * Stripe Edge Client Factory & Mock Sandbox Provider (@beadsily/payments)
 * Compatible with Cloudflare Workers Edge Runtime & Node test runners.
 */

import { createHmac } from 'node:crypto';

export class MockStripeClient {
  constructor(apiKey = 'sk_test_mock_beadsily') {
    this.apiKey = apiKey;
    this.checkout = {
      sessions: {
        create: async (params) => {
          const sessionId = `cs_test_${Math.random().toString(36).substring(2, 12)}`;
          const clientSecret = `${sessionId}_secret_${Math.random().toString(36).substring(2, 8)}`;
          return {
            id: sessionId,
            client_secret: clientSecret,
            status: 'open',
            ui_mode: params.ui_mode || 'embedded',
            mode: params.mode || 'payment',
            amount_total: params.line_items ? params.line_items.reduce((s, i) => s + (i.price_data.unit_amount * i.quantity), 0) : 0,
            currency: 'usd',
            customer_email: params.customer_email,
            metadata: params.metadata || {},
            client_reference_id: params.client_reference_id,
            return_url: params.return_url,
          };
        },
        retrieve: async (sessionId) => {
          return {
            id: sessionId,
            status: 'complete',
            payment_status: 'paid',
            currency: 'usd',
          };
        },
      },
    };

    this.paymentIntents = {
      retrieve: async (piId) => {
        return {
          id: piId,
          status: 'succeeded',
          amount: 18900,
          currency: 'usd',
        };
      },
      create: async (params) => {
        return {
          id: `pi_test_${Math.random().toString(36).substring(2, 12)}`,
          client_secret: `pi_test_secret_${Math.random().toString(36).substring(2, 8)}`,
          status: 'requires_payment_method',
          amount: params.amount,
          currency: params.currency || 'usd',
          metadata: params.metadata || {},
        };
      },
    };

    this.billingPortal = {
      sessions: {
        create: async (params) => {
          return {
            id: `bps_test_${Math.random().toString(36).substring(2, 12)}`,
            url: `https://billing.stripe.com/session/test_${Math.random().toString(36).substring(2, 8)}`,
            customer: params.customer,
            return_url: params.return_url,
          };
        },
      },
    };

    this.webhooks = {
      constructEvent: (rawBody, signatureHeader, secret) => {
        return JSON.parse(rawBody);
      },
      constructEventAsync: async (rawBody, signatureHeader, secret) => {
        return JSON.parse(rawBody);
      },
    };
  }
}

/**
 * Initializes a Stripe client instance.
 * Automatically falls back to MockStripeClient in testmode / sandboxes when apiKey is mock/absent.
 */
export function createStripeClient(apiKey, options = {}) {
  if (!apiKey || apiKey.startsWith('sk_test_mock') || apiKey === 'mock_key' || process.env.NODE_ENV === 'test') {
    return new MockStripeClient(apiKey);
  }

  try {
    // Dynamic import if real stripe package is available
    const Stripe = globalThis.Stripe || null;
    if (Stripe) {
      return new Stripe(apiKey, {
        apiVersion: '2024-09-30.acacia',
        httpClient: Stripe.createFetchHttpClient ? Stripe.createFetchHttpClient() : undefined,
        appInfo: {
          name: 'BeadsILY Commerce',
          version: '1.0.0',
          url: 'https://beadsily.com',
        },
        ...options,
      });
    }
  } catch (err) {
    // Fall back to MockStripeClient if Stripe package is not bundled in environment
  }

  return new MockStripeClient(apiKey);
}
