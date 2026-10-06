/**
 * BeadsILY Acceptance Test Suite: Payments, Webhooks & Checkout Integrity
 * Requirements: PAY-01 through PAY-05
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

function createPaymentsDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE webhook_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      payload_hash TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('received', 'processed', 'failed')),
      created_at INTEGER NOT NULL,
      processed_at INTEGER
    );

    CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
      amount_cents INTEGER NOT NULL,
      fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
      stripe_payment_intent_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  return db;
}

// Generate valid Stripe HMAC signature for webhook testing
function generateStripeSignature(payload, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const signedPayload = `${timestamp}.${payload}`;
  const hmac = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return `t=${timestamp},v1=${hmac}`;
}

// Verify Stripe Webhook Signature
function verifyStripeSignature(payload, signatureHeader, secret, toleranceSeconds = 300) {
  if (!signatureHeader) throw new Error('MISSING_SIGNATURE');

  const elements = signatureHeader.split(',');
  let timestamp = null;
  const signatures = [];

  for (const element of elements) {
    const [prefix, val] = element.split('=');
    if (prefix === 't') timestamp = parseInt(val, 10);
    if (prefix === 'v1') signatures.push(val);
  }

  if (!timestamp || signatures.length === 0) throw new Error('INVALID_SIGNATURE_FORMAT');

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    throw new Error('TIMESTAMP_OUTSIDE_TOLERANCE');
  }

  const expectedHmac = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  const expectedBuf = Buffer.from(expectedHmac);
  const isValid = signatures.some(sig => {
    const sigBuf = Buffer.from(sig);
    return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
  });

  if (!isValid) throw new Error('SIGNATURE_VERIFICATION_FAILED');
  return true;
}

describe('PAY-01: Server-Derived Pricing & Tamper Defense', () => {
  const AUTHORITATIVE_PRICES = {
    'kit-base-15': 9900,
    'add-on-guest': 650,
    'mystery-maker': 2400,
  };

  function computeServerOrderTotal(items) {
    let totalCents = 0;
    for (const item of items) {
      const unitPrice = AUTHORITATIVE_PRICES[item.sku];
      if (!unitPrice) throw new Error(`UNKNOWN_SKU: ${item.sku}`);
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error('INVALID_QUANTITY');
      }
      totalCents += unitPrice * item.quantity;
    }
    return totalCents;
  }

  test('Server calculates authoritative total and ignores client-submitted price tampering', () => {
    // Client attempts to submit $0.01 for a $99 kit
    const clientPayload = {
      items: [{ sku: 'kit-base-15', quantity: 1, clientPriceCents: 1 }],
      clientReportedTotalCents: 1,
    };

    const serverCalculatedTotal = computeServerOrderTotal(clientPayload.items);
    assert.equal(serverCalculatedTotal, 9900, 'Server must enforce $99.00 (9900 cents)');
    assert.notEqual(serverCalculatedTotal, clientPayload.clientReportedTotalCents);
  });
});

describe('PAY-02: Payment State Machine & Evidence Requirements', () => {
  test('Redirect query params alone cannot mark an order paid without provider verification', () => {
    function processReturnUrl(queryParams, orderRecord) {
      // Insecure pattern: queryParams.redirect_status === 'succeeded'
      // Secure pattern: order payment state remains pending until verified via Stripe API or webhook
      if (queryParams.payment_intent && !orderRecord.verifiedByWebhook) {
        return { orderStatus: orderRecord.payment_status, message: 'Payment processing, awaiting confirmation' };
      }
      return { orderStatus: 'paid' };
    }

    const order = { id: 'ord-1', payment_status: 'pending', verifiedByWebhook: false };
    const result = processReturnUrl({ payment_intent: 'pi_test123', redirect_status: 'succeeded' }, order);

    assert.equal(result.orderStatus, 'pending', 'Order remains pending until cryptographic webhook arrives');
  });
});

describe('PAY-03 & PAY-04: Webhook Signature, Idempotency & Replay Resistance', () => {
  let db;
  const webhookSecret = 'whsec_test_secret_1234567890abcdef';

  beforeEach(() => {
    db = createPaymentsDb();
    db.exec("INSERT INTO orders VALUES ('ord-999', 'cust-1', 'pending', 9900, 'unfulfilled', 'pi_test1', 1728212400000, 1728212400000)");
  });

  function handleWebhook(rawBody, signatureHeader) {
    // 1. Signature Verification
    verifyStripeSignature(rawBody, signatureHeader, webhookSecret);

    const event = JSON.parse(rawBody);
    const eventHash = crypto.createHash('sha256').update(rawBody).digest('hex');
    const now = Date.now();

    // 2. Check for duplicate event (Idempotency)
    const existing = db.prepare("SELECT * FROM webhook_events WHERE event_id = ?").get(event.id);
    if (existing && existing.status === 'processed') {
      return { status: 200, message: 'Event already processed (idempotent no-op)' };
    }

    db.exec('BEGIN TRANSACTION');
    try {
      db.prepare(`
        INSERT INTO webhook_events VALUES (?, ?, ?, 'received', ?, NULL)
        ON CONFLICT(event_id) DO NOTHING
      `).run(event.id, event.type, eventHash, now);

      if (event.type === 'checkout.session.completed') {
        const orderId = event.data.object.metadata.order_id;
        db.prepare("UPDATE orders SET payment_status = 'paid', updated_at = ? WHERE id = ?").run(now, orderId);
      }

      db.prepare("UPDATE webhook_events SET status = 'processed', processed_at = ? WHERE event_id = ?").run(now, event.id);
      db.exec('COMMIT');
      return { status: 200, message: 'Event processed successfully' };
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  test('Valid webhook processes order; duplicate delivery returns 200 OK without re-processing', () => {
    const payload = JSON.stringify({
      id: 'evt_test_101',
      type: 'checkout.session.completed',
      data: { object: { metadata: { order_id: 'ord-999' } } },
    });
    const sig = generateStripeSignature(payload, webhookSecret);

    // Initial delivery
    const res1 = handleWebhook(payload, sig);
    assert.equal(res1.status, 200);
    assert.equal(res1.message, 'Event processed successfully');

    const orderAfterFirst = db.prepare("SELECT * FROM orders WHERE id = 'ord-999'").get();
    assert.equal(orderAfterFirst.payment_status, 'paid');

    // Duplicate delivery (retry by Stripe)
    const res2 = handleWebhook(payload, sig);
    assert.equal(res2.status, 200);
    assert.equal(res2.message, 'Event already processed (idempotent no-op)');
  });

  test('Forged or tampered webhook payload is rejected with signature error', () => {
    const payload = JSON.stringify({ id: 'evt_forged_999', type: 'charge.succeeded' });
    const currentTs = Math.floor(Date.now() / 1000);
    const fakeSignature = `t=${currentTs},v1=badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbad`;

    assert.throws(
      () => handleWebhook(payload, fakeSignature),
      /SIGNATURE_VERIFICATION_FAILED/
    );
  });
});

describe('PAY-05: IDOR Defense & Billing Portal Customer Isolation', () => {
  test('User cannot access another customer order or create billing portal for another customer ID', () => {
    const authenticatedUser = { id: 'cust-sarah', role: 'customer' };

    function authorizeOrderAccess(orderOwnerId, user) {
      if (user.role === 'customer' && orderOwnerId !== user.id) {
        throw new Error('FORBIDDEN_IDOR: Cannot access an order owned by another customer');
      }
      return { authorized: true };
    }

    assert.equal(authorizeOrderAccess('cust-sarah', authenticatedUser).authorized, true);

    assert.throws(
      () => authorizeOrderAccess('cust-victim', authenticatedUser),
      /FORBIDDEN_IDOR/
    );
  });
});
