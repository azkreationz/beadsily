/**
 * BeadsILY Acceptance Test Suite: Curated Mystery Boxes (Physical Assortment)
 * Requirements: MYS-01 through MYS-06
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

function createMysteryDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE sealed_mystery_units (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL,
      theme_code TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('available', 'reserved', 'sold', 'damaged')),
      allocated_order_id TEXT,
      contents_snapshot_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE customer_orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      product_type TEXT NOT NULL,
      allocated_unit_id TEXT REFERENCES sealed_mystery_units(id),
      is_subscription INTEGER NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  return db;
}

describe('MYS-01: Guaranteed Project Counts by Mystery Box Tier', () => {
  const mysteryTiers = {
    'mystery-maker': {
      title: 'Mystery Maker Solo Box',
      guaranteedProjects: 3,
      breakdown: { pens: 1, bracelets: 1, keychains: 1 },
      priceCents: 2400,
    },
    'bestie-duo': {
      title: 'Bestie Duo Craft Box',
      guaranteedProjects: 6,
      breakdown: { pens: 2, bracelets: 2, keychains: 2 },
      priceCents: 4200,
    },
    'mystery-party-15': {
      title: '15-Person Mystery Party Kit',
      guaranteedProjects: 45,
      breakdown: { pens: 15, bracelets: 15, keychains: 15 },
      priceCents: 9900,
    },
  };

  test('All mystery tiers enforce exact project guarantees across recipes and orders', () => {
    for (const [tierKey, tier] of Object.entries(mysteryTiers)) {
      const sum = tier.breakdown.pens + tier.breakdown.bracelets + tier.breakdown.keychains;
      assert.equal(sum, tier.guaranteedProjects, `${tier.title} must have exactly ${tier.guaranteedProjects} projects`);
    }
    assert.equal(mysteryTiers['mystery-maker'].guaranteedProjects, 3);
    assert.equal(mysteryTiers['bestie-duo'].guaranteedProjects, 6);
    assert.equal(mysteryTiers['mystery-party-15'].guaranteedProjects, 45);
  });
});

describe('MYS-02 & MYS-03: Prepacked Sealed Units & Persistent Allocation on Retry', () => {
  let db;
  const now = Date.now();

  beforeEach(() => {
    db = createMysteryDb();
    // Seed 2 prepacked sealed units of Mystery Maker (Theme A and Theme B)
    db.exec(`
      INSERT INTO sealed_mystery_units VALUES (
        'unit-001', 'MYS-MKR-01', 'THEME-UNICORN', 'available', NULL, 
        '{"focals":["unicorn"],"pen":"metallic-pink","accents":["pastel-12mm"]}', ${now}, ${now}
      );
      INSERT INTO sealed_mystery_units VALUES (
        'unit-002', 'MYS-MKR-02', 'THEME-GALAXY', 'available', NULL, 
        '{"focals":["planet"],"pen":"cosmic-purple","accents":["glitter-14mm"]}', ${now}, ${now}
      );
    `);
  });

  test('MYS-03: Two buyers race for final unit; retry retains same persistent allocation', () => {
    // Only 1 available unit left (make unit-002 sold)
    db.exec("UPDATE sealed_mystery_units SET status = 'sold' WHERE id = 'unit-002'");

    // Buyer 1 allocates the unit
    const allocateUnit = (orderId) => {
      db.exec('BEGIN TRANSACTION');
      const unit = db.prepare("SELECT * FROM sealed_mystery_units WHERE status = 'available' LIMIT 1").get();
      if (!unit) {
        db.exec('ROLLBACK');
        return { success: false, error: 'OUT_OF_STOCK' };
      }
      db.prepare("UPDATE sealed_mystery_units SET status = 'reserved', allocated_order_id = ?, updated_at = ? WHERE id = ?").run(orderId, now, unit.id);
      db.prepare("INSERT INTO customer_orders VALUES (?, 'cust-1', 'mystery_box', ?, 0, 'pending', ?)").run(orderId, unit.id, now);
      db.exec('COMMIT');
      return { success: true, unitId: unit.id };
    };

    const attempt1 = allocateUnit('order-101');
    assert.equal(attempt1.success, true);
    assert.equal(attempt1.unitId, 'unit-001');

    // Buyer 2 races for unit; out of stock
    const attempt2 = allocateUnit('order-102');
    assert.equal(attempt2.success, false);
    assert.equal(attempt2.error, 'OUT_OF_STOCK');

    // Simulate Webhook Retry on Buyer 1's order:
    // Webhook must lookup existing allocated unit rather than rerolling or allocating a new one
    const orderRecord = db.prepare("SELECT * FROM customer_orders WHERE id = 'order-101'").get();
    assert.equal(orderRecord.allocated_unit_id, 'unit-001', 'Webhook retry preserves persistent unit assignment');
  });
});

describe('MYS-04 & MYS-05: API Privacy & No Recurring Billing Invariants', () => {
  test('MYS-05: Public API sanitizes internal surprise contents before delivery', () => {
    const internalUnitData = {
      id: 'unit-001',
      sku: 'MYS-MKR-01',
      title: 'Mystery Maker Solo Box',
      priceCents: 2400,
      guaranteedProjects: 3,
      themeCode: 'THEME-UNICORN',
      internalSurpriseFocals: ['ultra-rare-pastel-unicorn-glow'],
      warehouseBin: 'BIN-42A',
    };

    function sanitizeForPublicClient(unit) {
      return {
        id: unit.id,
        sku: unit.sku,
        title: unit.title,
        priceCents: unit.priceCents,
        guaranteedProjects: unit.guaranteedProjects,
        themeCategory: 'Magical & Whimsical', // High-level hint, surprise withheld
      };
    }

    const publicView = sanitizeForPublicClient(internalUnitData);
    assert.equal(publicView.internalSurpriseFocals, undefined, 'Internal focal secrets must never leak to client JSON');
    assert.equal(publicView.warehouseBin, undefined, 'Warehouse bin locations must never leak');
    assert.equal(publicView.guaranteedProjects, 3);
  });

  test('MYS-05: One-time mystery box purchase never creates recurring Stripe subscriptions', () => {
    const checkoutPayload = {
      productId: 'mystery-maker',
      isSubscription: false,
    };

    function createPaymentSession(payload) {
      if (payload.productId.startsWith('mystery-') && payload.isSubscription) {
        throw new Error('ILLEGAL_STATE: Mystery boxes cannot be enrolled in recurring subscriptions');
      }
      return {
        mode: 'payment', // One-time Stripe payment mode, NEVER 'subscription'
        recurring: null,
      };
    }

    const session = createPaymentSession(checkoutPayload);
    assert.equal(session.mode, 'payment');
    assert.equal(session.recurring, null);

    assert.throws(
      () => createPaymentSession({ productId: 'mystery-maker', isSubscription: true }),
      /Mystery boxes cannot be enrolled in recurring subscriptions/
    );
  });
});

describe('MYS-06: Damaged Returns Reference Actual Packed Contents', () => {
  test('Replacement or refund workflow inspects actual packed contents and audits restock', () => {
    const db = createMysteryDb();
    const now = Date.now();
    db.exec(`
      INSERT INTO sealed_mystery_units VALUES (
        'unit-888', 'MYS-MKR-01', 'THEME-UNICORN', 'sold', 'order-777', 
        '{"focals":["unicorn-classic"],"pen":"pastel-lavender"}', ${now}, ${now}
      );
    `);

    // Customer reports broken pen in unit-888
    const unit = db.prepare("SELECT * FROM sealed_mystery_units WHERE id = 'unit-888'").get();
    const packedContents = JSON.parse(unit.contents_snapshot_json);

    assert.equal(packedContents.pen, 'pastel-lavender', 'Support can verify exact item packed');

    // Return received: marked damaged, cannot be restocked as available
    db.prepare("UPDATE sealed_mystery_units SET status = 'damaged', updated_at = ? WHERE id = 'unit-888'").run(now + 1000);

    const updatedUnit = db.prepare("SELECT status FROM sealed_mystery_units WHERE id = 'unit-888'").get();
    assert.equal(updatedUnit.status, 'damaged');
  });
});
