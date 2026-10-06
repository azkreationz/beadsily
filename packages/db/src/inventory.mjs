/**
 * BeadsILY Inventory & Atomic Reservation Repository
 * Author: Oscar (oscar-muwid2fm), Backend Data & Inventory Engineer
 * Targets: Cloudflare D1 (SQLite)
 * Compliant with: INV-01, INV-02, INV-03, INV-04, INV-05, INV-06, INV-08, MYS-01, MYS-02, MYS-03
 */

/**
 * Calculates BOM requirements for a given product and guest count
 */
export function calculateKitBOM(db, productSku, guestCount = 15) {
  const product = db.prepare('SELECT * FROM products WHERE sku = ?').get(productSku);
  if (!product) {
    throw new Error(`Product not found for SKU: ${productSku}`);
  }

  const bomLines = db.prepare(`
    SELECT 
      b.component_id,
      c.sku as component_sku,
      c.name as component_name,
      c.category,
      b.quantity_per_guest,
      b.fixed_kit_quantity,
      b.safety_spare_quantity,
      b.is_substitutable,
      b.substitute_component_id
    FROM bill_of_materials b
    JOIN components c ON b.component_id = c.id
    WHERE b.product_id = ?
  `).all(product.id);

  if (bomLines.length === 0) {
    throw new Error(`No BOM found for product: ${productSku}`);
  }

  return bomLines.map(line => {
    // Dynamic scaling formula: FixedQuantity + ceil(GuestCount * PerGuestRate) + SafetySpare
    const dynamicQty = Math.ceil(guestCount * line.quantity_per_guest);
    const totalRequired = line.fixed_kit_quantity + dynamicQty + line.safety_spare_quantity;

    return {
      componentId: line.component_id,
      componentSku: line.component_sku,
      componentName: line.component_name,
      quantityRequired: totalRequired
    };
  });
}

/**
 * Atomically reserves a complete multi-component Party Kit BOM.
 * If ANY single component is short, the entire transaction rolls back atomically (INV-01, INV-02).
 */
export function reservePartyKit(db, { sessionId, productSku, guestCount = 15, expiresAtMs = Date.now() + 900000 }) {
  // Check for existing active reservation for idempotency
  const existingRes = db.prepare("SELECT * FROM reservations WHERE session_id = ? AND status = 'active'").get(sessionId);
  if (existingRes) {
    const items = db.prepare('SELECT * FROM reservation_items WHERE reservation_id = ?').all(existingRes.id);
    return { success: true, reservationId: existingRes.id, items, retried: true };
  }

  const requirements = calculateKitBOM(db, productSku, guestCount);
  const reservationId = `res_${sessionId}_${Date.now()}`;
  const now = Math.floor(Date.now() / 1000);
  const expiresAtSec = Math.floor(expiresAtMs / 1000);

  try {
    db.exec('BEGIN TRANSACTION');

    db.prepare(`
      INSERT INTO reservations (id, session_id, status, expires_at, created_at, updated_at)
      VALUES (?, ?, 'active', ?, ?, ?)
    `).run(reservationId, sessionId, expiresAtSec, now, now);

    // Inserting into reservation_items automatically fires trigger trg_reserve_component
    // which increments components.stock_reserved and tests chk_stock_reserved.
    // If stock is short, the trigger raises INSUFFICIENT_STOCK aborting the batch!
    const insertStmt = db.prepare(`
      INSERT INTO reservation_items (id, reservation_id, component_id, quantity_reserved, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < requirements.length; i++) {
      const item = requirements[i];
      insertStmt.run(`${reservationId}_item_${i}`, reservationId, item.componentId, item.quantityRequired, now);
    }

    db.exec('COMMIT');
    return { success: true, reservationId, requirements, retried: false };
  } catch (err) {
    db.exec('ROLLBACK');
    return { success: false, error: err.message };
  }
}

/**
 * Releases an active reservation (e.g. checkout abandonment, timeout, session expiry) (INV-06)
 */
export function releaseReservation(db, sessionId) {
  const res = db.prepare("SELECT id FROM reservations WHERE session_id = ? AND status = 'active'").get(sessionId);
  if (!res) {
    return { released: false, reason: 'RESERVATION_NOT_FOUND_OR_INACTIVE' };
  }

  try {
    db.exec('BEGIN TRANSACTION');
    // Deleting reservation_items triggers trg_release_component, decrementing stock_reserved automatically
    db.prepare('DELETE FROM reservation_items WHERE reservation_id = ?').run(res.id);
    db.prepare("UPDATE reservations SET status = 'cancelled', updated_at = strftime('%s', 'now') WHERE id = ?").run(res.id);
    db.exec('COMMIT');
    return { released: true, reservationId: res.id };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/**
 * Commits a reservation upon confirmed Stripe payment (sale_consume)
 * Decrements stock_on_hand and stock_reserved, records order and movements.
 */
export function commitOrderPayment(db, {
  orderId,
  orderNumber,
  customerEmail,
  sessionId,
  subtotalCents,
  taxCents = 0,
  shippingCents = 0,
  totalCents,
  items = []
}) {
  const res = db.prepare("SELECT id FROM reservations WHERE session_id = ? AND status = 'active'").get(sessionId);
  const now = Math.floor(Date.now() / 1000);

  try {
    db.exec('BEGIN TRANSACTION');

    // 1. Create order
    db.prepare(`
      INSERT INTO orders (
        id, order_number, status, customer_email, subtotal_cents, tax_cents, 
        shipping_cents, total_cents, stripe_checkout_session_id, reservation_id, paid_at, created_at, updated_at
      ) VALUES (?, ?, 'paid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, orderNumber, customerEmail, subtotalCents, taxCents, shippingCents, totalCents, sessionId, res ? res.id : null, now, now, now);

    // 2. Consume reserved stock for party kits if reservation exists
    if (res) {
      const reservedItems = db.prepare('SELECT component_id, quantity_reserved FROM reservation_items WHERE reservation_id = ?').all(res.id);

      for (const item of reservedItems) {
        // Deduct from stock_on_hand (physical consumption)
        db.prepare(`
          UPDATE components 
          SET stock_on_hand = stock_on_hand - ?,
              updated_at = ?
          WHERE id = ?
        `).run(item.quantity_reserved, now, item.component_id);

        // Record append-only movement
        db.prepare(`
          INSERT INTO inventory_movements (id, component_id, movement_type, quantity_delta, reference_id, reference_type, actor_id, reason, created_at)
          VALUES (?, ?, 'sale_consume', ?, ?, 'order', 'stripe_webhook', 'Confirmed order payment stock consumption', ?)
        `).run(`mov_${orderId}_${item.component_id}`, item.component_id, -item.quantity_reserved, orderId, now);
      }

      // Deleting reservation_items triggers trg_release_component which automatically decrements stock_reserved!
      db.prepare('DELETE FROM reservation_items WHERE reservation_id = ?').run(res.id);
      db.prepare("UPDATE reservations SET status = 'committed', updated_at = ? WHERE id = ?").run(now, res.id);
    }

    // 3. Insert order items
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, guest_count, customization, allocated_sealed_unit_id, unit_price_cents, total_price_cents, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      insertOrderItem.run(
        `${orderId}_line_${i}`,
        orderId,
        item.productId,
        item.variantId || null,
        item.quantity || 1,
        item.guestCount || 1,
        item.customization ? JSON.stringify(item.customization) : null,
        item.allocatedSealedUnitId || null,
        item.unitPriceCents,
        item.totalPriceCents,
        now
      );
    }

    db.exec('COMMIT');
    return { success: true, orderId, orderNumber };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// Re-export mystery box operations from dedicated module (MYS-01..MYS-06)
export {
  prepackSealedMysteryUnit,
  allocateSealedMysteryUnit,
  commitMysteryUnitSale,
  releaseMysteryReservation,
  sanitizeMysteryUnitForPublicClient,
  validateMysteryNoSubscription,
  auditMysteryRestock,
  getMysteryCatalog,
  validateMysteryTierGuarantees,
  detectMysteryTable,
  MYSTERY_TIERS
} from './mystery.mjs';

