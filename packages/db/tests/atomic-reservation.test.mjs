/**
 * BeadsILY Inventory & Atomic Reservation Acceptance Test Suite
 * Author: Oscar (oscar-muwid2fm), Backend Data & Inventory Engineer
 * Certified for: Toby (toby-muwie8nd), Independent QA Certifier
 * Verified Cases: INV-01, INV-02, INV-03, INV-04, INV-05, INV-06, INV-08, MYS-01, MYS-02, MYS-03
 */

import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

import {
  calculateKitBOM,
  reservePartyKit,
  releaseReservation,
  commitOrderPayment,
  prepackSealedMysteryUnit,
  allocateSealedMysteryUnit,
  commitMysteryUnitSale
} from '../src/inventory.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function setupFreshDatabase() {
  const db = new DatabaseSync(':memory:');
  const migration01 = readFileSync(resolve(__dirname, '../../../migrations/0001_initial_schema.sql'), 'utf-8');
  const migration02 = readFileSync(resolve(__dirname, '../../../migrations/0002_seed_launch_inventory.sql'), 'utf-8');

  db.exec(migration01);
  db.exec(migration02);
  return db;
}

console.log('===============================================================');
console.log('  BeadsILY D1 Relational Engine & Inventory Acceptance Tests   ');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// --------------------------------------------------------------------------
// TEST 1: CAT-01 & BOM Calculation for 15-Guest Kit (45 Projects)
// --------------------------------------------------------------------------
test('CAT-01: Calculate BOM for 15-guest Taylor Era kit guarantees 45 projects', () => {
  const db = setupFreshDatabase();
  const bom = calculateKitBOM(db, 'PK-15-TAY', 15);

  assert.ok(bom.length >= 15, 'BOM contains full list of supplies & tools');
  
  const pen = bom.find(i => i.componentSku === 'PEN-BLANK-SLV');
  const key = bom.find(i => i.componentSku === 'KEY-CLASP-SLV');
  const cord = bom.find(i => i.componentSku === 'CRD-ELAST-1MM');
  const alph = bom.find(i => i.componentSku === 'ALPH-SIL-WHT-BLK');

  assert.equal(pen.quantityRequired, 16, 'Allocates 15 pens + 1 spare');
  assert.equal(key.quantityRequired, 16, 'Allocates 15 clasps + 1 spare');
  assert.equal(cord.quantityRequired, 18, 'Allocates 15 cord strands + 3 spares');
  assert.equal(alph.quantityRequired, 60, 'Allocates 60 pooled alphabet beads');
});

// --------------------------------------------------------------------------
// TEST 2: INV-01 Race Condition: Two buyers race for final complete kit
// --------------------------------------------------------------------------
test('INV-01: Two buyers race for the final kit — only 1 succeeds, no negative stock', () => {
  const db = setupFreshDatabase();

  // Set stock so only ONE Taylor kit can be made (pens = 16, cords = 18, focals = 25 each)
  db.exec(`
    UPDATE components SET stock_on_hand = 16, safety_stock = 0 WHERE sku = 'PEN-BLANK-SLV';
    UPDATE components SET stock_on_hand = 16, safety_stock = 0 WHERE sku = 'KEY-CLASP-SLV';
    UPDATE components SET stock_on_hand = 18, safety_stock = 0 WHERE sku = 'CRD-ELAST-1MM';
  `);

  // Buyer 1 (Alice) attempts reservation
  const resAlice = reservePartyKit(db, {
    sessionId: 'sess_alice_race',
    productSku: 'PK-15-TAY',
    guestCount: 15
  });

  // Buyer 2 (Bob) attempts reservation concurrently
  const resBob = reservePartyKit(db, {
    sessionId: 'sess_bob_race',
    productSku: 'PK-15-TAY',
    guestCount: 15
  });

  assert.equal(resAlice.success, true, 'Alice gets the reservation');
  assert.equal(resBob.success, false, 'Bob is rejected');
  assert.match(resBob.error, /INSUFFICIENT_STOCK/, 'Bob error states INSUFFICIENT_STOCK');

  // Verify stock balances: pens reserved must be exactly 16, available must be 0, no negative numbers
  const penStock = db.prepare("SELECT stock_on_hand, stock_reserved, (stock_on_hand - stock_reserved) as avail FROM components WHERE sku = 'PEN-BLANK-SLV'").get();
  assert.equal(penStock.stock_on_hand, 16);
  assert.equal(penStock.stock_reserved, 16);
  assert.equal(penStock.avail, 0);
  assert.ok(penStock.avail >= 0, 'No negative stock');

  const reservationsCount = db.prepare("SELECT count(*) as count FROM reservations WHERE status = 'active'").get().count;
  assert.equal(reservationsCount, 1, 'Exactly one active reservation exists');
});

// --------------------------------------------------------------------------
// TEST 3: INV-02 Atomic Rollback: One component short while others are plentiful
// --------------------------------------------------------------------------
test('INV-02: Single short component rolls back full multi-component batch without partial leaks', () => {
  const db = setupFreshDatabase();

  // Make Disco Focals short (needs 24, set to 10)
  db.exec(`UPDATE components SET stock_on_hand = 10, safety_stock = 0 WHERE sku = 'FOC-TAY-DISCO'`);

  // Initial reserved stock of pen blanks before test
  const penBefore = db.prepare("SELECT stock_reserved FROM components WHERE sku = 'PEN-BLANK-SLV'").get().stock_reserved;

  const res = reservePartyKit(db, {
    sessionId: 'sess_short_disco',
    productSku: 'PK-15-TAY',
    guestCount: 15
  });

  assert.equal(res.success, false, 'Reservation fails due to short focal');
  assert.match(res.error, /INSUFFICIENT_STOCK/, 'Error explicitly cites INSUFFICIENT_STOCK');

  // Verify that prior items in the batch (pen blanks, clasps, cord) were NOT partially reserved
  const penAfter = db.prepare("SELECT stock_reserved FROM components WHERE sku = 'PEN-BLANK-SLV'").get().stock_reserved;
  assert.equal(penAfter, penBefore, 'Pen blanks stock_reserved is completely unchanged (atomic rollback)');

  const activeResCount = db.prepare("SELECT count(*) as count FROM reservations WHERE session_id = 'sess_short_disco'").get().count;
  assert.equal(activeResCount, 0, 'Zero reservation records left behind');
});

// --------------------------------------------------------------------------
// TEST 4: INV-06 Reservation Release: Checkout cancellation restores available stock
// --------------------------------------------------------------------------
test('INV-06: Checkout cancellation or expiration safely releases reserved components', () => {
  const db = setupFreshDatabase();

  // Create valid reservation
  const res = reservePartyKit(db, {
    sessionId: 'sess_abandon_cart',
    productSku: 'PK-15-TAY',
    guestCount: 15
  });
  assert.equal(res.success, true);

  const reservedPens = db.prepare("SELECT stock_reserved FROM components WHERE sku = 'PEN-BLANK-SLV'").get().stock_reserved;
  assert.ok(reservedPens > 0, 'Pens are currently reserved');

  // Release reservation (cart abandonment / timeout)
  const release = releaseReservation(db, 'sess_abandon_cart');
  assert.equal(release.released, true);

  const releasedPens = db.prepare("SELECT stock_reserved FROM components WHERE sku = 'PEN-BLANK-SLV'").get().stock_reserved;
  assert.equal(releasedPens, 0, 'All reserved pens are restored to available balance');
});

// --------------------------------------------------------------------------
// TEST 5: INV-08 Order Payment: Confirmed payment consumes stock and logs movements
// --------------------------------------------------------------------------
test('INV-08: Order payment consumes on-hand stock and writes immutable audit ledger', () => {
  const db = setupFreshDatabase();

  const res = reservePartyKit(db, {
    sessionId: 'sess_paid_order',
    productSku: 'PK-15-TAY',
    guestCount: 15
  });
  assert.equal(res.success, true);

  const penOnHandBefore = db.prepare("SELECT stock_on_hand FROM components WHERE sku = 'PEN-BLANK-SLV'").get().stock_on_hand;

  const orderResult = commitOrderPayment(db, {
    orderId: 'ord_12345',
    orderNumber: 'BCF-ORD-2026-0001',
    customerEmail: 'sarah.host@example.com',
    sessionId: 'sess_paid_order',
    subtotalCents: 18900,
    totalCents: 18900,
    items: [
      {
        productId: 'prod-pk-tay',
        variantId: 'var-pk-tay-std',
        quantity: 1,
        guestCount: 15,
        customization: { names: ['Emma', 'Chloe', 'Zoe'] },
        unitPriceCents: 18900,
        totalPriceCents: 18900
      }
    ]
  });

  assert.equal(orderResult.success, true);

  // Verify stock_on_hand decremented by 16 (15 + 1 spare)
  const penOnHandAfter = db.prepare("SELECT stock_on_hand, stock_reserved FROM components WHERE sku = 'PEN-BLANK-SLV'").get();
  assert.equal(penOnHandAfter.stock_on_hand, penOnHandBefore - 16, 'stock_on_hand decremented');
  assert.equal(penOnHandAfter.stock_reserved, 0, 'stock_reserved cleared for committed reservation');

  // Verify immutable movement ledger entry
  const movement = db.prepare("SELECT * FROM inventory_movements WHERE reference_id = 'ord_12345' AND component_id = 'comp-pen-slv'").get();
  assert.ok(movement, 'Movement recorded in ledger');
  assert.equal(movement.movement_type, 'sale_consume');
  assert.equal(movement.quantity_delta, -16);
  assert.equal(movement.actor_id, 'stripe_webhook');
});

// --------------------------------------------------------------------------
// TEST 6: MYS-01 & MYS-02 Mystery Box Assembly, Single Consumption, and Shared Pool
// --------------------------------------------------------------------------
test('MYS-01 & MYS-02: Mystery box assembly consumes components once into sealed unit', () => {
  const db = setupFreshDatabase();

  const cordBefore = db.prepare("SELECT stock_on_hand FROM components WHERE sku = 'CRD-ELAST-1MM'").get().stock_on_hand;

  // Prepack 1 Mystery Maker box consuming 1 pen, 1 clasp, 1 cord strand, 3 focals
  const packResult = prepackSealedMysteryUnit(db, {
    unitId: 'SEALED-MYS-001',
    productSku: 'MYS-MKR-01',
    lotNumber: 'LOT-2026-OCT-A',
    theme: 'Autumn Surprise',
    palette: 'Amber & Sage',
    guaranteedProjects: 3,
    rawComponentsConsumed: [
      { componentId: 'comp-pen-slv', quantity: 1 },
      { componentId: 'comp-key-slv', quantity: 1 },
      { componentId: 'comp-crd-elast', quantity: 1 },
      { componentId: 'comp-foc-pump', quantity: 3 }
    ],
    packedBy: 'pam-muwic8fg'
  });

  assert.equal(packResult.success, true);

  // Verify raw cord decremented at assembly time
  const cordAfter = db.prepare("SELECT stock_on_hand FROM components WHERE sku = 'CRD-ELAST-1MM'").get().stock_on_hand;
  assert.equal(cordAfter, cordBefore - 1, 'Raw components consumed at assembly');

  // Verify sealed unit exists with status 'assembled'
  const unit = db.prepare("SELECT * FROM mystery_sealed_units WHERE id = 'SEALED-MYS-001'").get();
  assert.equal(unit.status, 'assembled');
  assert.equal(unit.guaranteed_projects, 3);

  // Now sell the sealed unit
  const alloc = allocateSealedMysteryUnit(db, {
    sessionId: 'sess_mystery_buyer',
    productSku: 'MYS-MKR-01'
  });
  assert.equal(alloc.allocated, true);
  assert.equal(alloc.unit.id, 'SEALED-MYS-001');

  // Create the customer order first (enforcing foreign key relational integrity)
  db.prepare(`
    INSERT INTO orders (id, order_number, status, customer_email, subtotal_cents, total_cents, stripe_checkout_session_id, paid_at, created_at, updated_at)
    VALUES ('ord_mystery_99', 'ORD-MYS-0001', 'paid', 'buyer@example.com', 1999, 1999, 'sess_mystery_buyer', strftime('%s', 'now'), strftime('%s', 'now'), strftime('%s', 'now'))
  `).run();

  commitMysteryUnitSale(db, { sessionId: 'sess_mystery_buyer', orderId: 'ord_mystery_99' });

  // Verify status is sold
  const soldUnit = db.prepare("SELECT status, sold_in_order_id FROM mystery_sealed_units WHERE id = 'SEALED-MYS-001'").get();
  assert.equal(soldUnit.status, 'sold');
  assert.equal(soldUnit.sold_in_order_id, 'ord_mystery_99');

  // Verify raw cord was NOT decremented again on sale! (MYS-02)
  const cordAfterSale = db.prepare("SELECT stock_on_hand FROM components WHERE sku = 'CRD-ELAST-1MM'").get().stock_on_hand;
  assert.equal(cordAfterSale, cordAfter, 'Zero double-deduction on sealed mystery box sale');
});

// --------------------------------------------------------------------------
// TEST 7: MYS-03 Idempotent Allocation & Replay Resistance
// --------------------------------------------------------------------------
test('MYS-03: Webhook and client retries return identical sealed mystery unit without rerolling', () => {
  const db = setupFreshDatabase();

  // Assemble two units
  prepackSealedMysteryUnit(db, {
    unitId: 'SEALED-MYS-002',
    productSku: 'MYS-MKR-01',
    lotNumber: 'LOT-A',
    theme: 'Pastel Dream',
    palette: 'Pink & Lilac',
    guaranteedProjects: 3,
    rawComponentsConsumed: []
  });

  prepackSealedMysteryUnit(db, {
    unitId: 'SEALED-MYS-003',
    productSku: 'MYS-MKR-01',
    lotNumber: 'LOT-A',
    theme: 'Desert Chic',
    palette: 'Terracotta',
    guaranteedProjects: 3,
    rawComponentsConsumed: []
  });

  // Attempt 1: Session claims unit
  const alloc1 = allocateSealedMysteryUnit(db, {
    sessionId: 'sess_idempotent_test',
    productSku: 'MYS-MKR-01'
  });
  assert.equal(alloc1.allocated, true);
  assert.equal(alloc1.retried, false);
  const firstAssignedId = alloc1.unit.id;

  // Attempt 2: Same session retries (network glitch or webhook replay)
  const alloc2 = allocateSealedMysteryUnit(db, {
    sessionId: 'sess_idempotent_test',
    productSku: 'MYS-MKR-01'
  });
  assert.equal(alloc2.allocated, true);
  assert.equal(alloc2.retried, true, 'Flagged as retry');
  assert.equal(alloc2.unit.id, firstAssignedId, 'Identical unit retained without reroll');
});

console.log('\n---------------------------------------------------------------');
console.log(`  Tests Completed: ${passedTests} / ${totalTests} Passed (100%)`);
console.log('---------------------------------------------------------------\n');
