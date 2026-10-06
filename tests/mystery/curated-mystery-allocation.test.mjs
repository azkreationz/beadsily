/**
 * BeadsILY Curated Mystery Box & Sealed-Unit Allocation Acceptance Test Suite
 * Requirements: MYS-01 through MYS-06
 * Author: Oscar (oscar-muwid2fm), Backend Data & Inventory Engineer
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import {
  MYSTERY_TIERS,
  validateMysteryTierGuarantees,
  prepackSealedMysteryUnit,
  allocateSealedMysteryUnit,
  releaseMysteryReservation,
  commitMysteryUnitSale,
  sanitizeMysteryUnitForPublicClient,
  validateMysteryNoSubscription,
  auditMysteryRestock,
  getMysteryCatalog
} from '../../packages/db/src/index.mjs';

function createProductionD1Db() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE components (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      stock_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (stock_on_hand >= 0),
      stock_reserved INTEGER NOT NULL DEFAULT 0 CHECK (stock_reserved >= 0),
      safety_stock INTEGER NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
      unit_cost_cents INTEGER NOT NULL DEFAULT 0,
      bin_location TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE mystery_sealed_units (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id),
      variant_id TEXT,
      product_sku TEXT NOT NULL,
      lot_number TEXT NOT NULL,
      theme TEXT NOT NULL,
      palette TEXT NOT NULL,
      guaranteed_projects INTEGER NOT NULL DEFAULT 3,
      contents_snapshot TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('assembled', 'reserved', 'sold', 'quarantined', 'damaged')) DEFAULT 'assembled',
      reserved_by_session_id TEXT,
      reserved_at INTEGER,
      reservation_expires_at INTEGER,
      sold_in_order_id TEXT,
      bin_location TEXT,
      packed_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE inventory_movements (
      id TEXT PRIMARY KEY,
      component_id TEXT NOT NULL REFERENCES components(id),
      movement_type TEXT NOT NULL,
      quantity_delta INTEGER NOT NULL,
      reference_id TEXT,
      reference_type TEXT,
      actor_id TEXT NOT NULL,
      reason TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'paid',
      customer_email TEXT NOT NULL,
      total_cents INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  const now = Math.floor(Date.now() / 1000);
  // Seed components
  db.prepare(`
    INSERT INTO components (id, sku, name, category, stock_on_hand, stock_reserved, safety_stock, unit_cost_cents, bin_location, updated_at)
    VALUES 
      ('cmp-pen', 'PEN-BLANK-MET', 'Beadable Pen', 'hardware', 100, 0, 10, 65, 'BIN-10A', ${now}),
      ('cmp-key', 'KEY-CLASP-SWV', 'Lobster Clasp', 'hardware', 100, 0, 10, 35, 'BIN-10B', ${now}),
      ('cmp-crd', 'CRD-ELAST-1MM', 'Elastic Cord', 'cord', 100, 0, 10, 15, 'BIN-10C', ${now}),
      ('cmp-foc-uni', 'FOC-UNICORN', 'Unicorn Focal', 'silicone_focal', 50, 0, 5, 55, 'BIN-20A', ${now}),
      ('cmp-foc-cel', 'FOC-CELESTIAL', 'Celestial Focal', 'silicone_focal', 50, 0, 5, 55, 'BIN-20B', ${now}),
      ('cmp-foc-ret', 'FOC-RETRO', 'Retro Daisy Focal', 'silicone_focal', 50, 0, 5, 55, 'BIN-20C', ${now});
  `).run();

  // Seed products
  db.prepare(`
    INSERT INTO products (id, sku, name, slug, category, price_cents, status, created_at, updated_at)
    VALUES
      ('prod-mkr', 'MYS-MKR-01', 'Mystery Maker Solo', 'mystery-maker-solo', 'mystery-box', 2800, 'active', ${now}, ${now}),
      ('prod-duo', 'MYS-DUO-01', 'Bestie Mystery Duo', 'bestie-mystery-duo', 'mystery-box', 4800, 'active', ${now}, ${now}),
      ('prod-pty', 'PK-15-MYS', '15-Person Mystery Party', 'mystery-party-15', 'mystery-box', 18900, 'active', ${now}, ${now});
  `).run();

  return db;
}

describe('MYS-01: Guaranteed Project Counts by Mystery Box Tier', () => {
  test('All mystery tiers enforce exact project guarantees across recipes and catalog', () => {
    assert.equal(validateMysteryTierGuarantees(MYSTERY_TIERS), true);

    const solo = MYSTERY_TIERS['mystery-maker'];
    assert.equal(solo.guaranteedProjects, 3);
    assert.equal(solo.breakdown.pens, 1);
    assert.equal(solo.breakdown.bracelets, 1);
    assert.equal(solo.breakdown.keychains, 1);

    const duo = MYSTERY_TIERS['bestie-duo'];
    assert.equal(duo.guaranteedProjects, 6);
    assert.equal(duo.breakdown.pens, 2);
    assert.equal(duo.breakdown.bracelets, 2);
    assert.equal(duo.breakdown.keychains, 2);

    const party = MYSTERY_TIERS['mystery-party-15'];
    assert.equal(party.guaranteedProjects, 45);
    assert.equal(party.breakdown.pens, 15);
    assert.equal(party.breakdown.bracelets, 15);
    assert.equal(party.breakdown.keychains, 15);
  });
});

describe('MYS-02: Prepack Sealed Units & Ledger Audit (No Double Consumption)', () => {
  let db;

  beforeEach(() => {
    db = createProductionD1Db();
  });

  test('Prepacking raw components consumes on-hand stock and creates finished sealed unit', () => {
    const penBefore = db.prepare("SELECT stock_on_hand FROM components WHERE id = 'cmp-pen'").get();
    assert.equal(penBefore.stock_on_hand, 100);

    const result = prepackSealedMysteryUnit(db, {
      unitId: 'unit-solo-001',
      productSku: 'MYS-MKR-01',
      lotNumber: 'LOT-2026-10-A',
      theme: 'Whimsical Unicorns',
      palette: 'Pastel Dreams',
      guaranteedProjects: 3,
      rawComponentsConsumed: [
        { componentId: 'cmp-pen', quantity: 1 },
        { componentId: 'cmp-key', quantity: 1 },
        { componentId: 'cmp-crd', quantity: 1 },
        { componentId: 'cmp-foc-uni', quantity: 3 }
      ],
      packedBy: 'pam-muwic8fg'
    });

    assert.equal(result.success, true);
    assert.equal(result.unitId, 'unit-solo-001');

    // Verify raw on-hand stock was decremented
    const penAfter = db.prepare("SELECT stock_on_hand FROM components WHERE id = 'cmp-pen'").get();
    assert.equal(penAfter.stock_on_hand, 99);

    // Verify immutable movement ledger entry
    const movement = db.prepare("SELECT * FROM inventory_movements WHERE reference_id = 'LOT-2026-10-A'").get();
    assert.equal(movement.movement_type, 'assembly_consume');
    assert.equal(movement.actor_id, 'pam-muwic8fg');

    // Verify finished sealed unit is stored as 'assembled'
    const unit = db.prepare("SELECT * FROM mystery_sealed_units WHERE id = 'unit-solo-001'").get();
    assert.equal(unit.status, 'assembled');
    assert.equal(unit.guaranteed_projects, 3);
  });
});

describe('MYS-03: Two Buyers Race for Final Unit & Webhook Retry Idempotency', () => {
  let db;

  beforeEach(() => {
    db = createProductionD1Db();
    // Seed exactly one assembled unit
    prepackSealedMysteryUnit(db, {
      unitId: 'unit-final-01',
      productSku: 'MYS-MKR-01',
      lotNumber: 'LOT-SOLO-FINAL',
      theme: 'Celestial Gold',
      rawComponentsConsumed: [{ componentId: 'cmp-pen', quantity: 1 }]
    });
  });

  test('Race condition: First buyer secures unit, second buyer gets OUT_OF_STOCK', () => {
    // Buyer 1 attempts reservation
    const alloc1 = allocateSealedMysteryUnit(db, {
      sessionId: 'sess_buyer_1',
      productSku: 'MYS-MKR-01'
    });
    assert.equal(alloc1.allocated, true);
    assert.equal(alloc1.unit.id, 'unit-final-01');
    assert.equal(alloc1.retried, false);

    // Buyer 2 races for unit simultaneously; sold out
    const alloc2 = allocateSealedMysteryUnit(db, {
      sessionId: 'sess_buyer_2',
      productSku: 'MYS-MKR-01'
    });
    assert.equal(alloc2.allocated, false);
    assert.equal(alloc2.error, 'OUT_OF_STOCK');

    // Buyer 1 checkout retry / webhook replay receives the SAME persistent unit
    const retry1 = allocateSealedMysteryUnit(db, {
      sessionId: 'sess_buyer_1',
      productSku: 'MYS-MKR-01'
    });
    assert.equal(retry1.allocated, true);
    assert.equal(retry1.unit.id, 'unit-final-01');
    assert.equal(retry1.retried, true);
  });
});

describe('MYS-04: Customer Preferences & Honest Best-Effort Repeat Avoidance', () => {
  let db;

  beforeEach(() => {
    db = createProductionD1Db();
    // Prepack Theme Unicorn and Theme Celestial
    prepackSealedMysteryUnit(db, {
      unitId: 'unit-theme-uni',
      productSku: 'MYS-MKR-01',
      lotNumber: 'LOT-UNI',
      theme: 'Unicorn Dream',
      rawComponentsConsumed: [{ componentId: 'cmp-pen', quantity: 1 }]
    });
    prepackSealedMysteryUnit(db, {
      unitId: 'unit-theme-cel',
      productSku: 'MYS-MKR-01',
      lotNumber: 'LOT-CEL',
      theme: 'Celestial Night',
      rawComponentsConsumed: [{ componentId: 'cmp-pen', quantity: 1 }]
    });
  });

  test('Customer who previously received Unicorn gets Celestial unit', () => {
    const alloc = allocateSealedMysteryUnit(db, {
      sessionId: 'sess_returning_customer',
      productSku: 'MYS-MKR-01',
      customerPreviousThemes: ['Unicorn Dream']
    });

    assert.equal(alloc.allocated, true);
    assert.equal(alloc.unit.theme, 'Celestial Night');
    assert.equal(alloc.repeatTheme, false);
  });

  test('Honest repeat policy: If only previously received theme is available, flags repeat', () => {
    // Reserve the Celestial unit
    allocateSealedMysteryUnit(db, { sessionId: 'sess_other', productSku: 'MYS-MKR-01' });

    // Customer previously received both Unicorn and Celestial
    const alloc = allocateSealedMysteryUnit(db, {
      sessionId: 'sess_super_fan',
      productSku: 'MYS-MKR-01',
      customerPreviousThemes: ['Unicorn Dream', 'Celestial Night']
    });

    // Best-effort allocates available with flag
    assert.equal(alloc.allocated, true);
    assert.equal(alloc.repeatTheme, true);
  });

  test('Firm variety guarantee prevents purchase if novel theme unavailable', () => {
    const alloc = allocateSealedMysteryUnit(db, {
      sessionId: 'sess_strict',
      productSku: 'MYS-MKR-01',
      customerPreviousThemes: ['Unicorn Dream', 'Celestial Night'],
      firmVarietyGuarantee: true
    });

    assert.equal(alloc.allocated, false);
    assert.equal(alloc.error, 'VARIETY_GUARANTEE_UNAVAILABLE');
  });
});

describe('MYS-05: API Privacy Sanitization & No Recurring Subscriptions', () => {
  test('Public API sanitizes internal surprise focal details and warehouse bin', () => {
    const rawUnit = {
      id: 'unit-secret-01',
      product_sku: 'MYS-MKR-01',
      title: 'Mystery Maker Solo Box',
      price_cents: 2800,
      guaranteed_projects: 3,
      theme: 'Ultra Rare Holographic Dragon',
      contents_snapshot: '{"focals":["dragon_holo_rare"],"pen":"black"}',
      bin_location: 'VAULT-BIN-9',
      status: 'assembled'
    };

    const sanitized = sanitizeMysteryUnitForPublicClient(rawUnit);
    assert.equal(sanitized.id, 'unit-secret-01');
    assert.equal(sanitized.sku, 'MYS-MKR-01');
    assert.equal(sanitized.guaranteedProjects, 3);
    assert.equal(sanitized.themeCategory, 'Curated Assortment');
    assert.equal(sanitized.status, 'in_stock');

    // Sensitive internal secrets are withheld
    assert.equal(sanitized.theme, undefined);
    assert.equal(sanitized.contents_snapshot, undefined);
    assert.equal(sanitized.bin_location, undefined);
  });

  test('validateMysteryNoSubscription rejects subscription enrollment for mystery boxes', () => {
    // Valid one-time mystery box
    const valid = validateMysteryNoSubscription({
      productId: 'mystery-maker',
      isSubscription: false
    });
    assert.equal(valid.mode, 'payment');
    assert.equal(valid.recurring, null);

    // Invalid attempt to make mystery box recurring
    assert.throws(
      () => validateMysteryNoSubscription({ sku: 'MYS-MKR-01', isSubscription: true }),
      /ILLEGAL_STATE: Mystery boxes cannot be enrolled in recurring subscriptions/
    );

    assert.throws(
      () => validateMysteryNoSubscription({ productId: 'mystery-bestie', recurring: { interval: 'month' } }),
      /ILLEGAL_STATE: Mystery boxes cannot be enrolled in recurring subscriptions/
    );
  });
});

describe('MYS-06: Damaged Returns & Missing Contents Audit', () => {
  let db;

  beforeEach(() => {
    db = createProductionD1Db();
    prepackSealedMysteryUnit(db, {
      unitId: 'unit-damaged-test',
      productSku: 'MYS-MKR-01',
      lotNumber: 'LOT-RETURN-TEST',
      theme: 'Pastel Flora',
      rawComponentsConsumed: [
        { componentId: 'cmp-pen', quantity: 1 },
        { componentId: 'cmp-foc-ret', quantity: 3 }
      ]
    });
    // Mark sold
    db.prepare("UPDATE mystery_sealed_units SET status = 'sold', sold_in_order_id = 'ord_123' WHERE id = 'unit-damaged-test'").run();
  });

  test('Support audit references actual packed contents snapshot and prevents uncertified restock', () => {
    // Customer reports broken focal
    const auditResult = auditMysteryRestock(db, {
      sealedUnitId: 'unit-damaged-test',
      notes: 'Broken daisy focal charm reported',
      restockEligible: false,
      inspectorId: 'pam-muwic8fg'
    });

    assert.equal(auditResult.status, 'damaged');
    assert.equal(auditResult.restocked, false);
    assert.equal(auditResult.packedContents.length, 2);
    assert.equal(auditResult.packedContents[1].componentId, 'cmp-foc-ret');

    // Verify DB record status is damaged
    const record = db.prepare("SELECT status FROM mystery_sealed_units WHERE id = 'unit-damaged-test'").get();
    assert.equal(record.status, 'damaged');
  });

  test('Restock succeeds only when explicitly certified as restockEligible by QA', () => {
    const auditResult = auditMysteryRestock(db, {
      sealedUnitId: 'unit-damaged-test',
      notes: 'Unopened box returned intact, verified by QA',
      restockEligible: true,
      inspectorId: 'toby-muwie8nd'
    });

    assert.equal(auditResult.status, 'assembled');
    assert.equal(auditResult.restocked, true);

    const record = db.prepare("SELECT status FROM mystery_sealed_units WHERE id = 'unit-damaged-test'").get();
    assert.equal(record.status, 'assembled');
  });
});

describe('Catalog Query: getMysteryCatalog', () => {
  let db;

  beforeEach(() => {
    db = createProductionD1Db();
    // Prepack 2 Solo boxes and 1 Duo box
    prepackSealedMysteryUnit(db, {
      unitId: 'unit-s1',
      productSku: 'MYS-MKR-01',
      lotNumber: 'L1',
      theme: 'Theme 1',
      rawComponentsConsumed: []
    });
    prepackSealedMysteryUnit(db, {
      unitId: 'unit-s2',
      productSku: 'MYS-MKR-01',
      lotNumber: 'L2',
      theme: 'Theme 2',
      rawComponentsConsumed: []
    });
    prepackSealedMysteryUnit(db, {
      unitId: 'unit-d1',
      productSku: 'MYS-DUO-01',
      lotNumber: 'L3',
      theme: 'Theme 3',
      rawComponentsConsumed: []
    });
  });

  test('getMysteryCatalog returns accurate live stock tallies', () => {
    const catalog = getMysteryCatalog(db);
    assert.equal(catalog.length, 3);

    const solo = catalog.find(c => c.sku === 'MYS-MKR-01');
    assert.equal(solo.inStockCount, 2);
    assert.equal(solo.isAvailable, true);

    const duo = catalog.find(c => c.sku === 'MYS-DUO-01');
    assert.equal(duo.inStockCount, 1);
    assert.equal(duo.isAvailable, true);

    const party = catalog.find(c => c.sku === 'PK-15-MYS');
    assert.equal(party.inStockCount, 0);
    assert.equal(party.isAvailable, false);
  });
});
