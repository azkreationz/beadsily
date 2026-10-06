import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyStripeWebhookSignature, computeAuthoritativeOrderTotal } from './lib/security-modules.mjs';

const mockWebhookSecret = 'whsec_test_secret_for_beadsily_crypto_verification_987';
const mockPayload = JSON.stringify({
  id: 'evt_test_1001',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_test_3003',
      amount: 14500,
      currency: 'usd',
      status: 'succeeded',
    },
  },
});

function generateValidStripeHeader(payload, secret, customTimestamp = null) {
  const timestamp = customTimestamp || Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = createHmac('sha256', secret).update(signedPayload).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

test('Stripe Security: Valid webhook HMAC signature succeeds', () => {
  const header = generateValidStripeHeader(mockPayload, mockWebhookSecret);
  const result = verifyStripeWebhookSignature(mockPayload, header, mockWebhookSecret);
  assert.equal(result.valid, true);
  assert.ok(result.timestamp);
});

test('Stripe Security: Tampered payload body fails HMAC verification', () => {
  const header = generateValidStripeHeader(mockPayload, mockWebhookSecret);
  const tamperedPayload = mockPayload.replace('pi_test_3003', 'pi_HACKED_EVIL');
  const result = verifyStripeWebhookSignature(tamperedPayload, header, mockWebhookSecret);
  assert.equal(result.valid, false);
  assert.match(result.reason, /signature verification failed/);
});

test('Stripe Security: Invalid or forged signature fails', () => {
  const forgedHeader = 't=1760000000,v1=deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb';
  const result = verifyStripeWebhookSignature(mockPayload, forgedHeader, mockWebhookSecret);
  assert.equal(result.valid, false);
});

test('Stripe Security: Replayed signature beyond tolerance window (300s) fails', () => {
  const expiredTimestamp = Math.floor(Date.now() / 1000) - 350; // 350 seconds in past
  const expiredHeader = generateValidStripeHeader(mockPayload, mockWebhookSecret, expiredTimestamp);
  const result = verifyStripeWebhookSignature(mockPayload, expiredHeader, mockWebhookSecret);
  assert.equal(result.valid, false);
  assert.match(result.reason, /outside tolerance window/);
});

test('Stripe Security: Price Tampering Defense (PAY-01)', () => {
  const sampleCatalog = {
    'kit-party-15': {
      basePriceMinor: 8900, // $89.00 for 15 guests
      isPartyKit: true,
      additionalGuestFeeMinor: 1200, // $12.00 per guest above 15
    },
    'mystery-maker': {
      basePriceMinor: 2400, // $24.00 for 1-person mystery maker (3 projects)
      isPartyKit: false,
    },
  };

  // Client requests a 15-guest kit + 3 extra guests (18 guests total) + 1 Mystery Maker
  // Client attempts to pass a tampered unitPrice of $1.00 ($100 minor) and free guest add-ons
  const clientOrderAttempt = {
    items: [
      {
        productId: 'kit-party-15',
        quantity: 1,
        guestCount: 18,
        tamperedClientPriceMinor: 100, // Attacker tries to pay $1.00
      },
      {
        productId: 'mystery-maker',
        quantity: 1,
        tamperedClientPriceMinor: 50, // Attacker tries to pay $0.50
      },
    ],
  };

  // Server authoritative total computation
  const calculated = computeAuthoritativeOrderTotal(clientOrderAttempt, sampleCatalog);

  // Expected subtotal:
  // kit-party-15 (15 guests base = $89.00) + (3 extra guests * $12.00 = $36.00) = $125.00 (12500 cents)
  // mystery-maker = $24.00 (2400 cents)
  // Subtotal = 12500 + 2400 = 14900 cents ($149.00)
  // Shipping over $100 = $0.00
  // Tax (8.6% of 14900) = 1281 cents ($12.81)
  // Total = 14900 + 0 + 1281 = 16181 cents ($161.81)

  assert.equal(calculated.subtotalMinor, 14900);
  assert.equal(calculated.shippingMinor, 0);
  assert.equal(calculated.taxMinor, 1281);
  assert.equal(calculated.totalMinor, 16181);
  assert.equal(calculated.currency, 'usd');

  // Verify client's tampered prices were completely ignored
  assert.notEqual(calculated.totalMinor, 150);
});
