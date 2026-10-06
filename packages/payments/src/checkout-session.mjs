/**
 * BeadsILY Embedded Checkout Session Engine (@beadsily/payments)
 * Compliant with: PAY-01, PAY-02, INV-01, INV-02, INV-06, MYS-03, MYS-05
 * Author: Angela (angela-muwif3s4), Commercial Payments & Subscription Lead
 */

import crypto from 'node:crypto';
import { computeAuthoritativeOrderTotal } from './pricing.mjs';
import { reservePartyKit, allocateSealedMysteryUnit, releaseReservation } from '../../db/src/index.mjs';

/**
 * Creates an authoritative Stripe Embedded Checkout session with atomic D1 inventory reservation.
 *
 * @param {Object} params
 * @param {Object} params.db Cloudflare D1 Database instance
 * @param {Object} params.stripeClient Stripe client instance
 * @param {Object} params.cart Cart payload { items: [{ sku, quantity, guestCount?, customization? }] }
 * @param {string} params.customerEmail Customer's verified or provided email
 * @param {Object} [params.shippingAddress] Optional shipping address object
 * @param {string} [params.origin] Front-end origin URL (default https://beadsily.com)
 * @returns {Promise<Object>} Client secret, session ID, order ID, and verified amounts
 */
export async function createEmbeddedCheckoutSession({
  db,
  stripeClient,
  cart,
  customerEmail,
  shippingAddress = null,
  origin = 'https://beadsily.com',
}) {
  if (!customerEmail || !customerEmail.includes('@')) {
    throw new Error('VALIDATION_ERROR: A valid customer email is required for checkout');
  }

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    throw new Error('VALIDATION_ERROR: Cart cannot be empty');
  }

  // 1. Authoritative Server Pricing (PAY-01) - Discards client prices completely
  const pricing = computeAuthoritativeOrderTotal(cart.items, { db });
  const { subtotalCents, shippingCents, taxCents, totalCents, verifiedItems } = pricing;

  // 2. Generate unique session and order identifiers
  const sessionToken = `sess_${crypto.randomUUID().replace(/-/g, '')}`;
  const orderId = `ord_${crypto.randomUUID().replace(/-/g, '')}`;
  const now = Math.floor(Date.now() / 1000);
  const orderNumber = `BLY-${now.toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  // 3. Pre-Payment Inventory Reservation & Allocation
  const allocatedUnits = [];
  try {
    for (const item of verifiedItems) {
      if (item.isPartyKit) {
        // Atomic multi-component BOM reservation (INV-01, INV-02)
        const res = reservePartyKit(db, {
          sessionId: sessionToken,
          productSku: item.sku,
          guestCount: item.guestCount,
        });

        if (!res.success) {
          throw new Error(`INSUFFICIENT_STOCK: ${res.error || 'Components out of stock for ' + item.sku}`);
        }
      } else if (item.sku.startsWith('MYS-') || item.sku.includes('mystery')) {
        // Sealed unit prepacked mystery allocation (MYS-03, MYS-05)
        const alloc = allocateSealedMysteryUnit(db, {
          sessionId: sessionToken,
          productSku: item.sku,
        });

        if (!alloc.allocated) {
          throw new Error(`MYSTERY_BOX_SOLD_OUT: ${alloc.error || 'No sealed units available for ' + item.sku}`);
        }
        item.allocatedSealedUnitId = alloc.unit.id;
        allocatedUnits.push(alloc.unit.id);
      }
    }
  } catch (reservationErr) {
    // Release any partial reservations if batch fails (INV-06)
    try {
      releaseReservation(db, sessionToken);
    } catch (_) {}
    throw reservationErr;
  }

  // 4. Construct Stripe Embedded Checkout Session Line Items
  const lineItems = verifiedItems.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.title,
        description: item.isPartyKit
          ? `${item.guestCount} guests — ${item.projectsTotal} guaranteed finished keepsakes`
          : `${item.projectsTotal} guaranteed projects`,
        metadata: {
          sku: item.sku,
          guest_count: String(item.guestCount),
          projects_total: String(item.projectsTotal),
        },
      },
      unit_amount: item.unitPriceCents,
    },
    quantity: item.quantity,
  }));

  // Append shipping line item if applicable
  if (shippingCents > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Standard Ground Shipping (3–5 Business Days)',
          description: 'Flat rate ground shipping (Free on orders $100+)',
        },
        unit_amount: shippingCents,
      },
      quantity: 1,
    });
  }

  // Append sales tax line item if applicable
  if (taxCents > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Estimated Sales Tax (8.6% AZ Local)',
        },
        unit_amount: taxCents,
      },
      quantity: 1,
    });
  }

  // 5. Create Stripe Embedded Checkout Session
  // Embedded mode keeps the user seamlessly on beadsily.com (no external hosted redirect)
  const stripeSession = await stripeClient.checkout.sessions.create({
    ui_mode: 'embedded',
    mode: 'payment', // One-time payment mode (MYS-05: mystery boxes never enroll in subscriptions)
    customer_email: customerEmail,
    client_reference_id: sessionToken,
    return_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    line_items: lineItems,
    metadata: {
      order_id: orderId,
      order_number: orderNumber,
      reservation_id: sessionToken,
      customer_email: customerEmail,
      subtotal_cents: String(subtotalCents),
      shipping_cents: String(shippingCents),
      tax_cents: String(taxCents),
      total_cents: String(totalCents),
    },
  });

  // 6. Record Pending Order & Line Items in D1
  const activeRes = db.prepare("SELECT id FROM reservations WHERE session_id = ?").get(sessionToken);
  const reservationDbId = activeRes ? activeRes.id : null;

  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare(`
      INSERT INTO orders (
        id, order_number, status, customer_email, shipping_address, billing_address,
        subtotal_cents, tax_cents, shipping_cents, total_cents, currency,
        stripe_checkout_session_id, reservation_id, created_at, updated_at
      ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?, ?, ?)
    `).run(
      orderId,
      orderNumber,
      customerEmail,
      shippingAddress ? JSON.stringify(shippingAddress) : null,
      null,
      subtotalCents,
      taxCents,
      shippingCents,
      totalCents,
      stripeSession.id,
      reservationDbId,
      now,
      now
    );

    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (
        id, order_id, product_id, quantity, guest_count, customization,
        allocated_sealed_unit_id, unit_price_cents, total_price_cents, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < verifiedItems.length; i++) {
      const item = verifiedItems[i];
      const productRow = db.prepare('SELECT id FROM products WHERE sku = ? OR id = ?').get(item.sku, item.sku);
      const resolvedProductId = productRow ? productRow.id : (item.productId || item.sku);

      insertOrderItem.run(
        `${orderId}_line_${i}`,
        orderId,
        resolvedProductId,
        item.quantity,
        item.guestCount,
        item.customization ? JSON.stringify(item.customization) : null,
        item.allocatedSealedUnitId || null,
        item.unitPriceCents,
        item.lineTotalCents,
        now
      );
    }

    db.exec('COMMIT');
  } catch (dbErr) {
    db.exec('ROLLBACK');
    try {
      releaseReservation(db, sessionToken);
    } catch (_) {}
    throw dbErr;
  }

  return {
    clientSecret: stripeSession.client_secret,
    sessionId: stripeSession.id,
    sessionToken,
    orderId,
    orderNumber,
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents,
    verifiedItems,
  };
}
