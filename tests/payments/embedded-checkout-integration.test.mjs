/**
 * BeadsILY Integration Test Suite: Stripe Embedded Checkout & Webhooks
 * Verifies contract BCF-12 against real D1 schema and seed catalog
 * Requirements: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, INV-06, MYS-03, MYS-05
 * Author: Angela (angela-muwif3s4), Commercial Payments & Subscription Lead
 * Reviewers: Toby (toby-muwie8nd), Dwight (dwight-muwicook)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

import {
  computeAuthoritativeOrderTotal,
  createStripeClient,
  createEmbeddedCheckoutSession,
  verifyStripeWebhookSignature,
  handleStripeWebhookEvent,
  createBillingPortalSession,
} from '../../packages/payments/src/index.mjs';

import { prepackSealedMysteryUnit } from '../../packages/db/src/inventory.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function setupFreshDatabase() {
  const db = new DatabaseSync(':memory:');
  const migration01 = readFileSync(resolve(__dirname, '../../migrations/0001_initial_schema.sql'), 'utf-8');
  const migration02 = readFileSync(resolve(__dirname, '../../migrations/0002_seed_launch_inventory.sql'), 'utf-8');

  db.exec(migration01);
  db.exec(migration02);
  return db;
}

function generateStripeSignature(payload, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const signedPayload = `${timestamp}.${payload}`;
  const hmac = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return `t=${timestamp},v1=${hmac}`;
}

describe('BCF-12: Stripe Embedded Checkout & Payments Integration', () => {
  let db;
  let stripeClient;
  const webhookSecret = 'whsec_test_secret_for_beadsily_crypto_verification_987';

  beforeEach(() => {
    db = setupFreshDatabase();
    stripeClient = createStripeClient('sk_test_mock_angela');
  });

  // -------------------------------------------------------------------------
  // PAY-01: Server-Derived Pricing & Tamper Defense
  // -------------------------------------------------------------------------
  test('PAY-01: Server strictly enforces canonical prices and discards client tampering', async () => {
    // Prepack 2 sealed mystery units to satisfy inventory requirement
    prepackSealedMysteryUnit(db, {
      unitId: 'unit-mys-pay1-01',
      productSku: 'MYS-MKR-01',
      lotNumber: 'LOT-PAY1-01',
      theme: 'Desert Sunset Surprise',
      palette: 'Terracotta & Sage',
      guaranteedProjects: 3,
      rawComponentsConsumed: [{ componentId: 'comp-pen-slv', quantity: 1 }],
      packedBy: 'pam-muwic8fg',
    });
    prepackSealedMysteryUnit(db, {
      unitId: 'unit-mys-pay1-02',
      productSku: 'MYS-MKR-01',
      lotNumber: 'LOT-PAY1-02',
      theme: 'Boho Desert Surprise',
      palette: 'Terracotta & Sage',
      guaranteedProjects: 3,
      rawComponentsConsumed: [{ componentId: 'comp-pen-slv', quantity: 1 }],
      packedBy: 'pam-muwic8fg',
    });

    // Client attempts to tamper with base kit price ($1.00) and extra guest rate ($0.50)
    const tamperedCart = {
      items: [
        {
          sku: 'PK-15-TAY',
          quantity: 1,
          guestCount: 18, // 15 base + 3 extra
          tamperedPrice: 100, // Attacker sends $1.00
          tamperedTotal: 100,
        },
        {
          sku: 'MYS-MKR-01',
          quantity: 2,
          tamperedPrice: 50, // Attacker sends $0.50
        },
      ],
    };

    const checkout = await createEmbeddedCheckoutSession({
      db,
      stripeClient,
      cart: tamperedCart,
      customerEmail: 'sarah.mom@example.com',
    });

    // Authoritative calculations:
    // PK-15-TAY: 18900 base + (3 extra * 1200) = 22500 cents ($225.00)
    // MYS-MKR-01: 1999 * 2 = 3998 cents ($39.98)
    // Subtotal: 22500 + 3998 = 26498 cents ($264.98)
    // Shipping: >= $100 -> Free ($0)
    // Tax: round(26498 * 0.086) = 2279 cents ($22.79)
    // Total: 26498 + 0 + 2279 = 28777 cents ($287.77)

    assert.equal(checkout.subtotalCents, 26498);
    assert.equal(checkout.shippingCents, 0);
    assert.equal(checkout.taxCents, 2279);
    assert.equal(checkout.totalCents, 28777);

    // Verify D1 order matches server-derived total, not tampered client values
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(checkout.orderId);
    assert.equal(order.total_cents, 28777);
    assert.equal(order.status, 'pending');
    assert.equal(order.customer_email, 'sarah.mom@example.com');
  });

  test('PAY-01: Dynamic guest count scaling calculates correct project and monetary amounts', () => {
    // 15 guests base: 45 projects, $189.00 (18900)
    const base15 = computeAuthoritativeOrderTotal([{ sku: 'PK-15-TAY', guestCount: 15, quantity: 1 }], { db });
    assert.equal(base15.subtotalCents, 18900);
    assert.equal(base15.verifiedItems[0].projectsTotal, 45);

    // 16 guests (+1 guest): 48 projects, $201.00 (20100)
    const extra1 = computeAuthoritativeOrderTotal([{ sku: 'PK-15-TAY', guestCount: 16, quantity: 1 }], { db });
    assert.equal(extra1.subtotalCents, 20100);
    assert.equal(extra1.verifiedItems[0].projectsTotal, 48);

    // 20 guests (+5 guests): 60 projects, $249.00 (24900)
    const extra5 = computeAuthoritativeOrderTotal([{ sku: 'PK-15-TAY', guestCount: 20, quantity: 1 }], { db });
    assert.equal(extra5.subtotalCents, 24900);
    assert.equal(extra5.verifiedItems[0].projectsTotal, 60);

    // 30 guests max (+15 guests): 90 projects, $369.00 (36900)
    const max30 = computeAuthoritativeOrderTotal([{ sku: 'PK-15-TAY', guestCount: 30, quantity: 1 }], { db });
    assert.equal(max30.subtotalCents, 36900);
    assert.equal(max30.verifiedItems[0].projectsTotal, 90);

    // Rejects guestCount < 15
    assert.throws(
      () => computeAuthoritativeOrderTotal([{ sku: 'PK-15-TAY', guestCount: 14, quantity: 1 }], { db }),
      /minimum guest count is 15/
    );
  });

  // -------------------------------------------------------------------------
  // PAY-02: State Machine & Provider Evidence Invariant
  // -------------------------------------------------------------------------
  test('PAY-02: Order remains in pending state until verified by provider webhook', async () => {
    const checkout = await createEmbeddedCheckoutSession({
      db,
      stripeClient,
      cart: { items: [{ sku: 'PK-15-TAY', guestCount: 15, quantity: 1 }] },
      customerEmail: 'buyer@example.com',
    });

    const initialOrder = db.prepare('SELECT status, paid_at FROM orders WHERE id = ?').get(checkout.orderId);
    assert.equal(initialOrder.status, 'pending');
    assert.equal(initialOrder.paid_at, null);

    // Stock was reserved in D1, not yet consumed
    const res = db.prepare('SELECT status FROM reservations WHERE session_id = ?').get(checkout.sessionToken);
    assert.equal(res.status, 'active');
  });

  // -------------------------------------------------------------------------
  // PAY-03 & PAY-04: Webhook Signature Verification, Replay Deduplication & Order Transition
  // -------------------------------------------------------------------------
  test('PAY-03 & PAY-04: Webhook verifies signature, commits D1 stock reservation, and handles replays idempotently', async () => {
    const checkout = await createEmbeddedCheckoutSession({
      db,
      stripeClient,
      cart: { items: [{ sku: 'PK-15-TAY', guestCount: 15, quantity: 1 }] },
      customerEmail: 'taylor.fan@example.com',
    });

    const eventPayload = JSON.stringify({
      id: 'evt_stripe_webhook_real_001',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: checkout.sessionId,
          client_reference_id: checkout.sessionToken,
          payment_intent: 'pi_test_confirmed_999',
          metadata: {
            order_id: checkout.orderId,
            reservation_id: checkout.sessionToken,
          },
        },
      },
    });

    const validSignature = generateStripeSignature(eventPayload, webhookSecret);

    // First webhook delivery
    const outcome1 = await handleStripeWebhookEvent({
      db,
      rawBody: eventPayload,
      signatureHeader: validSignature,
      secret: webhookSecret,
    });

    assert.equal(outcome1.status, 200);
    assert.equal(outcome1.deduplicated, false);

    // Order transitioned to 'paid'
    const orderPaid = db.prepare('SELECT status, paid_at, stripe_payment_intent_id FROM orders WHERE id = ?').get(checkout.orderId);
    assert.equal(orderPaid.status, 'paid');
    assert.ok(orderPaid.paid_at > 0);
    assert.equal(orderPaid.stripe_payment_intent_id, 'pi_test_confirmed_999');

    // Reservation committed
    const resCommitted = db.prepare('SELECT status FROM reservations WHERE session_id = ?').get(checkout.sessionToken);
    assert.equal(resCommitted.status, 'committed');

    // Movement ledger recorded sale_consume
    const movements = db.prepare("SELECT * FROM inventory_movements WHERE reference_id = ? AND movement_type = 'sale_consume'").all(checkout.orderId);
    assert.ok(movements.length > 0, 'Movement ledger must record physical consumption upon payment');

    // Second webhook delivery (Stripe automated retry / replay)
    const outcome2 = await handleStripeWebhookEvent({
      db,
      rawBody: eventPayload,
      signatureHeader: validSignature,
      secret: webhookSecret,
    });

    assert.equal(outcome2.status, 200);
    assert.equal(outcome2.deduplicated, true);
    assert.match(outcome2.message, /already processed/);

    // Verify no double-decrement in inventory movements
    const movementsAfterReplay = db.prepare("SELECT * FROM inventory_movements WHERE reference_id = ? AND movement_type = 'sale_consume'").all(checkout.orderId);
    assert.equal(movementsAfterReplay.length, movements.length, 'Replay must not duplicate inventory deductions');
  });

  test('PAY-03: Webhook with forged or tampered HMAC signature is rejected with error', async () => {
    const payload = JSON.stringify({ id: 'evt_evil_001', type: 'payment_intent.succeeded' });
    const fakeSignature = 't=1791280000,v1=badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbad';

    await assert.rejects(
      async () => {
        await handleStripeWebhookEvent({
          db,
          rawBody: payload,
          signatureHeader: fakeSignature,
          secret: webhookSecret,
        });
      },
      /SIGNATURE_VERIFICATION_FAILED/
    );
  });

  // -------------------------------------------------------------------------
  // MYS-03 & MYS-05: Curated Mystery Box Allocation & One-Time Payment Invariant
  // -------------------------------------------------------------------------
  test('MYS-03 & MYS-05: Curated mystery box allocates sealed unit and completes in one-time mode', async () => {
    // Prepack 1 sealed Mystery Maker unit into D1
    prepackSealedMysteryUnit(db, {
      unitId: 'unit-mys-test-01',
      productSku: 'MYS-MKR-01',
      lotNumber: 'LOT-2026-TEST-01',
      theme: 'Desert Sunset Surprise',
      palette: 'Terracotta & Sage',
      guaranteedProjects: 3,
      rawComponentsConsumed: [{ componentId: 'comp-pen-slv', quantity: 1 }],
      packedBy: 'pam-muwic8fg',
    });

    const checkout = await createEmbeddedCheckoutSession({
      db,
      stripeClient,
      cart: { items: [{ sku: 'MYS-MKR-01', quantity: 1 }] },
      customerEmail: 'mystery.buyer@example.com',
    });

    // Verify unit was reserved
    const unit = db.prepare('SELECT status, reserved_by_session_id FROM mystery_sealed_units WHERE id = ?').get('unit-mys-test-01');
    assert.equal(unit.status, 'reserved');
    assert.equal(unit.reserved_by_session_id, checkout.sessionToken);

    // Simulate webhook payment
    const eventPayload = JSON.stringify({
      id: 'evt_mys_payment_001',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: checkout.sessionId,
          client_reference_id: checkout.sessionToken,
          metadata: { order_id: checkout.orderId },
        },
      },
    });

    const sig = generateStripeSignature(eventPayload, webhookSecret);
    await handleStripeWebhookEvent({
      db,
      rawBody: eventPayload,
      signatureHeader: sig,
      secret: webhookSecret,
    });

    // Mystery unit transitioned to 'sold' (MYS-02, MYS-03)
    const unitSold = db.prepare('SELECT status, sold_in_order_id FROM mystery_sealed_units WHERE id = ?').get('unit-mys-test-01');
    assert.equal(unitSold.status, 'sold');
    assert.equal(unitSold.sold_in_order_id, checkout.orderId);
  });

  // -------------------------------------------------------------------------
  // PAY-05: Customer Portal Isolation & IDOR Defense
  // -------------------------------------------------------------------------
  test('PAY-05: Customer Portal enforces customer isolation and rejects IDOR requests', async () => {
    const customerEmily = { id: 'cust-emily', role: 'customer' };

    // Emily requests portal for her own customer ID -> OK
    const allowed = await createBillingPortalSession({
      stripeClient,
      authenticatedUser: customerEmily,
      targetCustomerId: 'cust-emily',
      returnUrl: 'https://beadsily.com/account',
    });
    assert.ok(allowed.url.startsWith('https://billing.stripe.com/session/'));

    // Emily attempts IDOR to access Sarah's billing portal -> REJECTED
    await assert.rejects(
      async () => {
        await createBillingPortalSession({
          stripeClient,
          authenticatedUser: customerEmily,
          targetCustomerId: 'cust-sarah',
          returnUrl: 'https://beadsily.com/account',
        });
      },
      /FORBIDDEN_IDOR/
    );

    // Unauthenticated user -> REJECTED 401
    await assert.rejects(
      async () => {
        await createBillingPortalSession({
          stripeClient,
          authenticatedUser: null,
          targetCustomerId: 'cust-emily',
        });
      },
      /UNAUTHORIZED/
    );

    // Open redirect attempt to external malicious domain -> REJECTED
    await assert.rejects(
      async () => {
        await createBillingPortalSession({
          stripeClient,
          authenticatedUser: customerEmily,
          targetCustomerId: 'cust-emily',
          returnUrl: 'https://evil-phishing-site.com/steal-creds',
        });
      },
      /UNTRUSTED_RETURN_URL/
    );
  });
});
