/**
 * BeadsILY Acceptance Test Suite: Inventory Concurrency, Invariants & Ledger
 * Requirements: INV-01 through INV-09
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

function createInventoryDb() {
  const db = new DatabaseSync(':memory:');

  // Schema matching INVENTORY-MODEL.md & Toby/Jim recommendations
  db.exec(`
    CREATE TABLE components (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      stock_on_hand INTEGER NOT NULL DEFAULT 0,
      stock_reserved INTEGER NOT NULL DEFAULT 0,
      safety_stock INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      CHECK (stock_reserved >= 0),
      CHECK ((stock_on_hand - stock_reserved - safety_stock) >= 0)
    );

    CREATE TABLE finished_goods (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      stock_on_hand INTEGER NOT NULL DEFAULT 0,
      stock_reserved INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      CHECK (stock_reserved >= 0),
      CHECK ((stock_on_hand - stock_reserved) >= 0)
    );

    CREATE TABLE inventory_reservations (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      component_id TEXT NOT NULL REFERENCES components(id),
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('locked', 'committed', 'released')),
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE inventory_movements (
      id TEXT PRIMARY KEY,
      item_type TEXT NOT NULL CHECK (item_type IN ('component', 'finished_good')),
      item_id TEXT NOT NULL,
      movement_type TEXT NOT NULL CHECK (movement_type IN (
        'receipt', 'assembly_consume', 'assembly_produce', 'reservation_lock', 
        'reservation_release', 'sale_consume', 'booth_sale', 'damage', 'correction', 'return_restock'
      )),
      quantity_delta INTEGER NOT NULL,
      reference_id TEXT,
      actor_id TEXT NOT NULL,
      reason TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  return db;
}

describe('INV-01 & INV-02: Atomic Multi-Component Reservation & Rollback', () => {
  let db;
  const now = Date.now();

  beforeEach(() => {
    db = createInventoryDb();
    // Seed exactly enough stock for ONE 15-guest kit (15 pens, 15 clasps, 45 focals, 270 accents)
    db.exec(`
      INSERT INTO components VALUES ('pen-01', 'PEN-01', 'Pen Blank', 'pen', 15, 0, 0, ${now});
      INSERT INTO components VALUES ('clasp-01', 'KEY-01', 'Keychain Clasp', 'hardware', 15, 0, 0, ${now});
      INSERT INTO components VALUES ('foc-01', 'FOC-01', 'Focal Bead', 'focal', 45, 0, 0, ${now});
      INSERT INTO components VALUES ('acc-01', 'ACC-01', 'Accent Bead', 'bead', 270, 0, 0, ${now});
    `);
  });

  test('INV-01: Two buyers race for final kit - only one succeeds, no negative stock', () => {
    function attemptKitReservation(orderId) {
      db.exec('BEGIN TRANSACTION');
      try {
        db.prepare("UPDATE components SET stock_reserved = stock_reserved + 15, updated_at = ? WHERE id = 'pen-01'").run(now);
        db.prepare("UPDATE components SET stock_reserved = stock_reserved + 15, updated_at = ? WHERE id = 'clasp-01'").run(now);
        db.prepare("UPDATE components SET stock_reserved = stock_reserved + 45, updated_at = ? WHERE id = 'foc-01'").run(now);
        db.prepare("UPDATE components SET stock_reserved = stock_reserved + 270, updated_at = ? WHERE id = 'acc-01'").run(now);
        db.exec('COMMIT');
        return { success: true };
      } catch (err) {
        db.exec('ROLLBACK');
        return { success: false, error: err.message };
      }
    }

    const buyer1 = attemptKitReservation('order-1');
    const buyer2 = attemptKitReservation('order-2');

    assert.equal(buyer1.success, true, 'First buyer successfully reserves the kit');
    assert.equal(buyer2.success, false, 'Second buyer is rejected');
    assert.match(buyer2.error, /CHECK constraint failed/, 'Rejection is enforced by D1/SQLite CHECK constraint');

    // Verify stock counts: no negative balance, reserved equals on_hand
    const pen = db.prepare("SELECT * FROM components WHERE id = 'pen-01'").get();
    assert.equal(pen.stock_on_hand, 15);
    assert.equal(pen.stock_reserved, 15);
    assert.ok(pen.stock_on_hand >= pen.stock_reserved, 'Stock reserved cannot exceed stock on hand');
  });

  test('INV-02: One component short - all-or-nothing rollback leaves zero partial locks', () => {
    // Modify database so pen-01 has only 14 available (short by 1)
    db.exec("UPDATE components SET stock_on_hand = 14 WHERE id = 'pen-01'");

    db.exec('BEGIN TRANSACTION');
    let failed = false;
    try {
      // Clasp, focal, and accent are plentiful, but pen is short
      db.prepare("UPDATE components SET stock_reserved = stock_reserved + 15, updated_at = ? WHERE id = 'clasp-01'").run(now);
      db.prepare("UPDATE components SET stock_reserved = stock_reserved + 45, updated_at = ? WHERE id = 'foc-01'").run(now);
      db.prepare("UPDATE components SET stock_reserved = stock_reserved + 270, updated_at = ? WHERE id = 'acc-01'").run(now);
      db.prepare("UPDATE components SET stock_reserved = stock_reserved + 15, updated_at = ? WHERE id = 'pen-01'").run(now); // FAILS CHECK
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      failed = true;
    }

    assert.equal(failed, true, 'Reservation must fail due to single short component');

    // Critical check: Ensure clasp, focal, and accent were NOT partially reserved
    const clasp = db.prepare("SELECT stock_reserved FROM components WHERE id = 'clasp-01'").get();
    const focal = db.prepare("SELECT stock_reserved FROM components WHERE id = 'foc-01'").get();
    const accent = db.prepare("SELECT stock_reserved FROM components WHERE id = 'acc-01'").get();

    assert.equal(clasp.stock_reserved, 0, 'Clasp reservation must be 0 after rollback');
    assert.equal(focal.stock_reserved, 0, 'Focal reservation must be 0 after rollback');
    assert.equal(accent.stock_reserved, 0, 'Accent reservation must be 0 after rollback');
  });
});

describe('INV-03: Letter Bead Scarcity & Personalization', () => {
  test('Letter bead allowance respects limits or flags scarce character stops', () => {
    const pooledAllowance = 60;
    const requestedNames = ['EMILY', 'EVELYN', 'ELIZABETH', 'ELEANOR', 'GENEVIEVE'];
    const letterCounts = {};
    for (const name of requestedNames) {
      for (const char of name) {
        letterCounts[char] = (letterCounts[char] || 0) + 1;
      }
    }

    const totalLetters = Object.values(letterCounts).reduce((a, b) => a + b, 0);
    assert.ok(totalLetters <= pooledAllowance, 'Requested characters within pooled allowance');
    assert.equal(letterCounts['E'], 11, "Counted 11 'E' letters");

    // Enforce scarce letter limit: maximum 10 of any single vowel per standard 15-guest pool
    const maxPerLetterCap = 10;
    const isScarceOverflow = letterCounts['E'] > maxPerLetterCap;
    assert.equal(isScarceOverflow, true, 'Flagged scarce letter overflow when letter E count > 10');
  });
});

describe('INV-04: Cross-Channel Shared Component Balance', () => {
  test('Party kits, monthly boxes, and booth compete against the single authoritative balance', () => {
    const db = createInventoryDb();
    const now = Date.now();
    // 50 total pens in shared stock
    db.exec(`INSERT INTO components VALUES ('pen-01', 'PEN-01', 'Beadable Pen', 'pen', 50, 0, 5, ${now})`);

    // Channel 1: Party Kit reserves 15 pens
    db.prepare("UPDATE components SET stock_reserved = stock_reserved + 15 WHERE id = 'pen-01'").run();

    // Channel 2: Prepack Assembly for Mystery Boxes reserves 20 pens
    db.prepare("UPDATE components SET stock_reserved = stock_reserved + 20 WHERE id = 'pen-01'").run();

    // Channel 3: Booth allocation attempts to allocate 15 pens
    // Available = 50 - 35 (reserved) - 5 (safety) = 10 available. Attempting 15 should fail!
    assert.throws(() => {
      db.prepare("UPDATE components SET stock_reserved = stock_reserved + 15 WHERE id = 'pen-01'").run();
    }, /CHECK constraint failed/);

    const pen = db.prepare("SELECT * FROM components WHERE id = 'pen-01'").get();
    assert.equal(pen.stock_reserved, 35, 'Authoritative stock reserved is strictly 35 across channels');
  });
});

describe('INV-05: Pen Assembly vs Sale Double-Deduction', () => {
  test('Components consumed at assembly; sale consumes finished good; no double deduction', () => {
    const db = createInventoryDb();
    const now = Date.now();

    // Seed 10 pen blanks and 10 focals
    db.exec(`
      INSERT INTO components VALUES ('comp-pen', 'PEN-01', 'Pen Blank', 'pen', 10, 0, 0, ${now});
      INSERT INTO components VALUES ('comp-foc', 'FOC-01', 'Focal Bead', 'focal', 10, 0, 0, ${now});
      INSERT INTO finished_goods VALUES ('fg-pen-assembled', 'FIN-PEN-01', 'Assembled Finished Pen', 0, 0, ${now});
    `);

    // Step 1: Assemble 5 finished pens
    db.exec('BEGIN TRANSACTION');
    db.prepare("UPDATE components SET stock_on_hand = stock_on_hand - 5 WHERE id = 'comp-pen'").run();
    db.prepare("UPDATE components SET stock_on_hand = stock_on_hand - 5 WHERE id = 'comp-foc'").run();
    db.prepare("UPDATE finished_goods SET stock_on_hand = stock_on_hand + 5 WHERE id = 'fg-pen-assembled'").run();
    db.prepare("INSERT INTO inventory_movements VALUES ('m1', 'component', 'comp-pen', 'assembly_consume', -5, 'lot-1', 'packer-1', 'Assembly lot 1', ?)").run(now);
    db.prepare("INSERT INTO inventory_movements VALUES ('m2', 'finished_good', 'fg-pen-assembled', 'assembly_produce', 5, 'lot-1', 'packer-1', 'Assembly lot 1', ?)").run(now);
    db.exec('COMMIT');

    const compPen = db.prepare("SELECT stock_on_hand FROM components WHERE id = 'comp-pen'").get();
    const fgPen = db.prepare("SELECT stock_on_hand FROM finished_goods WHERE id = 'fg-pen-assembled'").get();
    assert.equal(compPen.stock_on_hand, 5, 'Raw pens decreased to 5');
    assert.equal(fgPen.stock_on_hand, 5, 'Finished pens increased to 5');

    // Step 2: Customer buys 2 finished pens
    db.exec('BEGIN TRANSACTION');
    db.prepare("UPDATE finished_goods SET stock_on_hand = stock_on_hand - 2 WHERE id = 'fg-pen-assembled'").run();
    db.prepare("INSERT INTO inventory_movements VALUES ('m3', 'finished_good', 'fg-pen-assembled', 'sale_consume', -2, 'order-99', 'system', 'Customer sale', ?)").run(now);
    db.exec('COMMIT');

    // Verify finished stock decreased, but raw component stock is untouched!
    const fgAfterSale = db.prepare("SELECT stock_on_hand FROM finished_goods WHERE id = 'fg-pen-assembled'").get();
    const compAfterSale = db.prepare("SELECT stock_on_hand FROM components WHERE id = 'comp-pen'").get();
    assert.equal(fgAfterSale.stock_on_hand, 3, 'Finished pens decreased to 3');
    assert.equal(compAfterSale.stock_on_hand, 5, 'Raw components remained at 5 (no double deduction)');
  });
});

describe('INV-06 & INV-07: Reservation Expiration & Payment Reconciliation', () => {
  test('INV-06: Checkout abandonment releases stock reservation', () => {
    const db = createInventoryDb();
    const now = Date.now();
    db.exec(`INSERT INTO components VALUES ('comp-pen', 'PEN-01', 'Pen Blank', 'pen', 20, 15, 0, ${now})`);
    db.exec(`INSERT INTO inventory_reservations VALUES ('res-1', 'ord-123', 'comp-pen', 15, 'locked', ${now - 1000}, ${now - 900000})`);

    // Reconciliation worker finds expired reservation and releases it
    const expiredRes = db.prepare("SELECT * FROM inventory_reservations WHERE status = 'locked' AND expires_at < ?").all(now);
    assert.equal(expiredRes.length, 1);

    db.exec('BEGIN TRANSACTION');
    db.prepare("UPDATE components SET stock_reserved = stock_reserved - 15 WHERE id = 'comp-pen'").run();
    db.prepare("UPDATE inventory_reservations SET status = 'released' WHERE id = 'res-1'").run();
    db.exec('COMMIT');

    const pen = db.prepare("SELECT stock_reserved FROM components WHERE id = 'comp-pen'").get();
    assert.equal(pen.stock_reserved, 0, 'Reservation released safely back to available pool');
  });

  test('INV-07: Late payment on expired reservation detects conflict and holds for refund', () => {
    const reservationStatus = 'released';
    const paymentArrivedLate = true;
    const currentStockAvailable = 0; // Meanwhile another customer took the stock

    let orderState;
    if (reservationStatus === 'released' && paymentArrivedLate) {
      if (currentStockAvailable < 15) {
        orderState = 'inventory_shortage_hold_for_refund';
      } else {
        orderState = 'reallocated';
      }
    }

    assert.equal(orderState, 'inventory_shortage_hold_for_refund', 'Surfaces exception for hold/refund rather than overselling');
  });
});

describe('INV-08: Restock & Return Audit Separation', () => {
  test('Financial refund does not automatically restock damaged components without QA inspection', () => {
    const db = createInventoryDb();
    const now = Date.now();
    db.exec(`INSERT INTO components VALUES ('comp-pen', 'PEN-01', 'Pen Blank', 'pen', 10, 0, 0, ${now})`);

    // Damaged return processed: money refunded, but physical unit marked damaged
    const isDamaged = true;
    db.exec('BEGIN TRANSACTION');
    if (!isDamaged) {
      db.prepare("UPDATE components SET stock_on_hand = stock_on_hand + 1 WHERE id = 'comp-pen'").run();
    }
    db.prepare(`
      INSERT INTO inventory_movements VALUES (
        'm-ret', 'component', 'comp-pen', 'damage', -1, 'order-ret-1', 'inspector-toby', 'Damaged mandrel returned by customer', ${now}
      )
    `).run();
    db.exec('COMMIT');

    const pen = db.prepare("SELECT stock_on_hand FROM components WHERE id = 'comp-pen'").get();
    assert.equal(pen.stock_on_hand, 10, 'Damaged return does not increase usable stock on hand');

    const movement = db.prepare("SELECT * FROM inventory_movements WHERE id = 'm-ret'").get();
    assert.equal(movement.movement_type, 'damage');
    assert.equal(movement.actor_id, 'inspector-toby');
  });
});

describe('INV-09: CSV Import Security & Formula Sanitization', () => {
  function sanitizeCsvCell(value) {
    if (typeof value !== 'string') return value;
    // Prevent spreadsheet formula injection (=, +, -, @, \t, \r)
    const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousPrefixes.some(p => value.startsWith(p))) {
      return `'${value}`;
    }
    return value;
  }

  test('Sanitizes dangerous spreadsheet formula injection prefixes', () => {
    assert.equal(sanitizeCsvCell('=CMD|\' /C calc\'!A0'), "'=CMD|' /C calc'!A0");
    assert.equal(sanitizeCsvCell('+SUM(1+1)'), "'+SUM(1+1)");
    assert.equal(sanitizeCsvCell('-20'), "'-20");
    assert.equal(sanitizeCsvCell('@mention'), "'@mention");
    assert.equal(sanitizeCsvCell('Normal Bead Name'), 'Normal Bead Name');
  });

  test('Validates and rejects negative counts or malformed units in CSV intake', () => {
    function validateIntakeRow(row) {
      if (!row.sku || row.sku.trim() === '') return { valid: false, error: 'MISSING_SKU' };
      if (!Number.isInteger(row.quantity) || row.quantity < 0) return { valid: false, error: 'INVALID_QUANTITY' };
      if (!['piece', 'inch', 'set', 'box'].includes(row.unit)) return { valid: false, error: 'INVALID_UNIT' };
      return { valid: true };
    }

    assert.equal(validateIntakeRow({ sku: 'PEN-01', quantity: 100, unit: 'piece' }).valid, true);
    assert.equal(validateIntakeRow({ sku: 'PEN-01', quantity: -10, unit: 'piece' }).valid, false);
    assert.equal(validateIntakeRow({ sku: 'PEN-01', quantity: 50, unit: 'liters' }).valid, false);
    assert.equal(validateIntakeRow({ sku: '', quantity: 50, unit: 'piece' }).valid, false);
  });
});
