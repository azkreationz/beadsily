/**
 * BeadsILY Stripe Webhook Verification & Idempotent Reconciliation Engine (@beadsily/payments)
 * Compliant with: PAY-02, PAY-03, PAY-04, INV-06, INV-07, MYS-03
 * Author: Angela (angela-muwif3s4), Commercial Payments & Subscription Lead
 */

import crypto from 'node:crypto';
import { releaseReservation, commitMysteryUnitSale } from '../../db/src/index.mjs';

/**
 * Verifies the Stripe webhook signature against the raw request body using constant-time comparison.
 *
 * @param {string} rawBody Raw UTF-8 request payload string
 * @param {string} signatureHeader Raw 'stripe-signature' header string
 * @param {string} secret Webhook endpoint secret ('whsec_...')
 * @param {number} [toleranceSeconds=300] Maximum acceptable clock skew in seconds
 * @returns {{ valid: boolean, timestamp?: number, reason?: string }} Verification result
 */
export function verifyStripeWebhookSignature(rawBody, signatureHeader, secret, toleranceSeconds = 300) {
  if (!signatureHeader || !secret) {
    return { valid: false, reason: 'Missing signature header or webhook secret.' };
  }

  const parts = signatureHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

  const timestamp = parseInt(parts.t, 10);
  const v1Signature = parts.v1;

  if (isNaN(timestamp) || !v1Signature) {
    return { valid: false, reason: 'Malformed stripe-signature header.' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return { valid: false, reason: 'Webhook signature timestamp outside tolerance window.' };
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedHmac = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  const expectedBuf = Buffer.from(expectedHmac, 'hex');
  const actualBuf = Buffer.from(v1Signature, 'hex');

  if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
    return { valid: false, reason: 'HMAC signature verification failed.' };
  }

  return { valid: true, timestamp };
}

/**
 * Handles incoming Stripe webhook events with two-phase D1 persistence, signature check,
 * and idempotent replay deduplication.
 *
 * @param {Object} params
 * @param {Object} params.db Cloudflare D1 Database instance
 * @param {string} params.rawBody Raw request payload
 * @param {string} params.signatureHeader stripe-signature header value
 * @param {string} params.secret Webhook signing secret
 * @returns {Promise<Object>} Handler response { status: 200, message: string, deduplicated?: boolean }
 */
export async function handleStripeWebhookEvent({ db, rawBody, signatureHeader, secret }) {
  // 1. Signature Verification
  const verification = verifyStripeWebhookSignature(rawBody, signatureHeader, secret);
  if (!verification.valid) {
    const err = new Error(`SIGNATURE_VERIFICATION_FAILED: ${verification.reason}`);
    err.status = 400;
    throw err;
  }

  const event = JSON.parse(rawBody);
  const eventHash = crypto.createHash('sha256').update(rawBody).digest('hex');
  const now = Math.floor(Date.now() / 1000);

  // 2. Idempotency Check (PAY-03, PAY-04)
  const existing = db.prepare('SELECT * FROM webhook_events WHERE event_id = ?').get(event.id);
  if (existing && existing.status === 'processed') {
    return {
      status: 200,
      message: 'Event already processed (idempotent no-op)',
      deduplicated: true,
      eventId: event.id,
    };
  }

  // 3. Two-Phase D1 State Machine Execution
  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare(`
      INSERT INTO webhook_events (event_id, event_type, payload_hash, status, created_at)
      VALUES (?, ?, ?, 'received', ?)
      ON CONFLICT(event_id) DO NOTHING
    `).run(event.id, event.type, eventHash, now);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.order_id;
      const reservationId = session.client_reference_id || session.metadata?.reservation_id;

      // Locate order by ID or stripe session
      const order = orderId
        ? db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
        : db.prepare('SELECT * FROM orders WHERE stripe_checkout_session_id = ?').get(session.id);

      if (order && order.status !== 'paid') {
        const resolvedOrderId = order.id;

        // Transition order status to 'paid'
        db.prepare(`
          UPDATE orders
          SET status = 'paid',
              paid_at = ?,
              stripe_payment_intent_id = ?,
              updated_at = ?
          WHERE id = ?
        `).run(now, session.payment_intent || null, now, resolvedOrderId);

        // Convert reservations to consumed stock
        const resId = reservationId || order.reservation_id;
        if (resId) {
          const resRecord = db.prepare("SELECT * FROM reservations WHERE session_id = ? AND status = 'active'").get(resId);
          if (resRecord) {
            // Deduct raw physical components for party kits
            const reservedItems = db.prepare(
              'SELECT component_id, quantity_reserved FROM reservation_items WHERE reservation_id = ?'
            ).all(resRecord.id);

            for (const item of reservedItems) {
              db.prepare(`
                UPDATE components
                SET stock_on_hand = stock_on_hand - ?,
                    updated_at = ?
                WHERE id = ?
              `).run(item.quantity_reserved, now, item.component_id);

              db.prepare(`
                INSERT INTO inventory_movements (
                  id, component_id, movement_type, quantity_delta, reference_id,
                  reference_type, actor_id, reason, created_at
                ) VALUES (?, ?, 'sale_consume', ?, ?, 'order', 'stripe_webhook', 'Confirmed checkout payment', ?)
              `).run(`mov_${resolvedOrderId}_${item.component_id}`, item.component_id, -item.quantity_reserved, resolvedOrderId, now);
            }

            // Deleting reservation items triggers trg_release_component to decrement stock_reserved!
            db.prepare('DELETE FROM reservation_items WHERE reservation_id = ?').run(resRecord.id);
            db.prepare("UPDATE reservations SET status = 'committed', updated_at = ? WHERE id = ?").run(now, resRecord.id);
          }

          // Commit sealed mystery units if allocated (MYS-02, MYS-03)
          try {
            commitMysteryUnitSale(db, { sessionId: resId, orderId: resolvedOrderId });
          } catch (_) {}
        }
      }
    } else if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        db.prepare("UPDATE orders SET status = 'paid', paid_at = ?, updated_at = ? WHERE id = ? AND status != 'paid'").run(now, now, orderId);
      }
    } else if (event.type === 'payment_intent.payment_failed' || event.type === 'checkout.session.expired') {
      const sessionOrPi = event.data.object;
      const orderId = sessionOrPi.metadata?.order_id;
      const reservationId = sessionOrPi.client_reference_id || sessionOrPi.metadata?.reservation_id;

      if (orderId) {
        db.prepare("UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ? AND status = 'pending'").run(now, orderId);
      }

      if (reservationId) {
        try {
          releaseReservation(db, reservationId);
        } catch (_) {}
      }
    }

    // Mark event processed
    db.prepare("UPDATE webhook_events SET status = 'processed', processed_at = ? WHERE event_id = ?").run(now, event.id);
    db.exec('COMMIT');

    return {
      status: 200,
      message: 'Event processed successfully',
      deduplicated: false,
      eventId: event.id,
    };
  } catch (err) {
    db.exec('ROLLBACK');
    try {
      db.prepare("UPDATE webhook_events SET status = 'failed' WHERE event_id = ?").run(event.id);
    } catch (_) {}
    throw err;
  }
}
