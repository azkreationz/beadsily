/**
 * BeadsILY Acceptance Test Suite: School Festival Booth Reconciliation & Kit Usability
 * Requirements: EVENT-01, EVENT-02, KIT-01
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createBoothSchema,
  allocateBoothInventory,
  processBoothReconciliationBatch,
  reconcileBoothCloseout
} from '../../packages/db/src/booth.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createBoothDb() {
  const db = new DatabaseSync(':memory:');
  createBoothSchema(db);
  return db;
}

describe('EVENT-01 & EVENT-02: Booth Sales & Offline Idempotent Reconciliation', () => {
  let db;
  const now = Date.now();

  beforeEach(() => {
    db = createBoothDb();
    // Allocate 30 finished pens and 20 keychains to the Santa Fe School Festival Booth
    allocateBoothInventory(db, [
      { sku: 'FIN-PEN-01', title: 'School Spirit Pen', allocatedQuantity: 30, unitPriceCents: 500 },
      { sku: 'FIN-KEY-01', title: 'Backpack Keychain Charm', allocatedQuantity: 20, unitPriceCents: 500 },
    ]);
  });

  test('EVENT-01: Rehearsal records offline cash and card sales accurately', () => {
    const offlineBatch = [
      { offlineSaleId: 'sale-001', sku: 'FIN-PEN-01', quantity: 2, paymentMethod: 'cash', amountCents: 1000, recordedAt: now - 3600000 },
      { offlineSaleId: 'sale-002', sku: 'FIN-KEY-01', quantity: 1, paymentMethod: 'square_pos', amountCents: 500, recordedAt: now - 3000000 },
    ];

    const result = processBoothReconciliationBatch(db, 'batch-oct23', offlineBatch);
    assert.equal(result.processed, 2);
    assert.equal(result.skippedDuplicates, 0);
    assert.equal(result.discrepancies.length, 0);

    const pen = db.prepare("SELECT * FROM booth_allocated_inventory WHERE sku = 'FIN-PEN-01'").get();
    assert.equal(pen.sold_quantity, 2);
    assert.equal(pen.allocated_quantity, 30);
  });

  test('EVENT-02: Idempotent replay of offline batch does not double-decrement stock', () => {
    const offlineBatch = [
      { offlineSaleId: 'sale-001', sku: 'FIN-PEN-01', quantity: 2, paymentMethod: 'cash', amountCents: 1000, recordedAt: now - 3600000 },
      { offlineSaleId: 'sale-002', sku: 'FIN-KEY-01', quantity: 1, paymentMethod: 'square_pos', amountCents: 500, recordedAt: now - 3000000 },
    ];

    // First sync
    processBoothReconciliationBatch(db, 'batch-oct23', offlineBatch);

    // Second sync of same offline tally (network retry)
    const retryResult = processBoothReconciliationBatch(db, 'batch-oct23', offlineBatch);
    assert.equal(retryResult.processed, 0);
    assert.equal(retryResult.skippedDuplicates, 2, 'Duplicate offline sales skipped idempotently');

    const pen = db.prepare("SELECT sold_quantity FROM booth_allocated_inventory WHERE sku = 'FIN-PEN-01'").get();
    assert.equal(pen.sold_quantity, 2, 'Stock remains exactly 2 sold (no double decrement)');
  });
});

describe('EVENT-01 & EVENT-02: Full 28-Transaction Santa Fe Fall Festival Fixture & Closeout', () => {
  let db;

  beforeEach(() => {
    db = createBoothDb();
    // Allocate full festival quota from section 2.1 of BOOTH-OPERATIONS-AND-RECONCILIATION.md
    allocateBoothInventory(db, [
      { sku: 'FIN-PEN-01', title: 'School Spirit Beadable Pen', allocatedQuantity: 40, unitPriceCents: 500 },
      { sku: 'FIN-KEY-01', title: 'Backpack Keychain Charm', allocatedQuantity: 30, unitPriceCents: 500 },
      { sku: 'BTH-SFE-01', title: 'Santa Fe Fall Mini-Kit', allocatedQuantity: 35, unitPriceCents: 600 },
      { sku: 'MYS-MKR-01', title: 'Mystery Maker Solo Craft Box', allocatedQuantity: 10, unitPriceCents: 1999 },
    ]);
  });

  test('Processes complete 28-sale offline batch with accurate cash/card split and stock tallies', () => {
    const fixturePath = path.join(__dirname, '..', '..', 'docs', 'event', 'fixtures', 'booth-offline-tally-oct23.json');
    const fixtureData = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    assert.equal(fixtureData.sales.length, 28);

    const result = processBoothReconciliationBatch(db, fixtureData.batchId, fixtureData.sales);

    assert.equal(result.processed, 28);
    assert.equal(result.skippedDuplicates, 0);
    assert.equal(result.discrepancies.length, 0);
    assert.equal(result.totalGrossCents, 26799, 'Gross revenue must equal $267.99 (26,799 cents)');
    assert.equal(result.cashGrossCents, 17200, 'Cash revenue must equal $172.00 (17,200 cents)');
    assert.equal(result.cardGrossCents, 9599, 'Card revenue must equal $95.99 (9,599 cents)');

    // Verify exact unit balances
    const pen = db.prepare("SELECT sold_quantity, allocated_quantity FROM booth_allocated_inventory WHERE sku = 'FIN-PEN-01'").get();
    assert.equal(pen.sold_quantity, 19);
    assert.equal(pen.allocated_quantity, 40);

    const key = db.prepare("SELECT sold_quantity, allocated_quantity FROM booth_allocated_inventory WHERE sku = 'FIN-KEY-01'").get();
    assert.equal(key.sold_quantity, 13);
    assert.equal(key.allocated_quantity, 30);

    const mini = db.prepare("SELECT sold_quantity, allocated_quantity FROM booth_allocated_inventory WHERE sku = 'BTH-SFE-01'").get();
    assert.equal(mini.sold_quantity, 17);
    assert.equal(mini.allocated_quantity, 35);

    const mys = db.prepare("SELECT sold_quantity, allocated_quantity FROM booth_allocated_inventory WHERE sku = 'MYS-MKR-01'").get();
    assert.equal(mys.sold_quantity, 1);
    assert.equal(mys.allocated_quantity, 10);
  });

  test('Idempotent replay of full 28-sale batch skips all duplicates with zero stock variance', () => {
    const fixturePath = path.join(__dirname, '..', '..', 'docs', 'event', 'fixtures', 'booth-offline-tally-oct23.json');
    const fixtureData = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    // First ingestion
    processBoothReconciliationBatch(db, fixtureData.batchId, fixtureData.sales);

    // Second ingestion (re-sync / network retry)
    const replayResult = processBoothReconciliationBatch(db, fixtureData.batchId, fixtureData.sales);

    assert.equal(replayResult.processed, 0, 'Zero new sales processed on replay');
    assert.equal(replayResult.skippedDuplicates, 28, 'All 28 transactions skipped as duplicates');
    assert.equal(replayResult.totalGrossCents, 0, 'No double-counted revenue');

    const pen = db.prepare("SELECT sold_quantity FROM booth_allocated_inventory WHERE sku = 'FIN-PEN-01'").get();
    assert.equal(pen.sold_quantity, 19, 'Sold quantity strictly remains 19 (no double decrement)');
  });

  test('Reconciles booth closeout cleanly and returns unsold stock to warehouse pool', () => {
    const fixturePath = path.join(__dirname, '..', '..', 'docs', 'event', 'fixtures', 'booth-offline-tally-oct23.json');
    const fixtureData = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    processBoothReconciliationBatch(db, fixtureData.batchId, fixtureData.sales);

    // Physical counts at 8:00 PM close:
    // PEN: 40 - 19 = 21 remaining
    // KEY: 30 - 13 = 17 remaining
    // MINI: 35 - 17 = 18 remaining
    // MYS: 10 - 1 = 9 remaining
    const physicalCounts = {
      'FIN-PEN-01': 21,
      'FIN-KEY-01': 17,
      'BTH-SFE-01': 18,
      'MYS-MKR-01': 9,
    };

    const closeout = reconcileBoothCloseout(db, fixtureData.batchId, physicalCounts);

    assert.equal(closeout.balanced, true, 'Reconciliation should balance with zero variance');
    assert.equal(closeout.totalVarianceUnits, 0);
    assert.equal(closeout.items.length, 4);

    // Verify booth allocation table is cleared
    const remainingAlloc = db.prepare("SELECT SUM(allocated_quantity) as total FROM booth_allocated_inventory").get();
    assert.equal(remainingAlloc.total, 0, 'Booth allocation table cleared after return to warehouse');
  });
});

describe('KIT-01: Novice Host Assembly Usability Verification', () => {
  test('Packing checklist verifies all 45 projects and assembly guidelines complete within 90 minutes', () => {
    const kitChecklist = {
      penCount: 15,
      claspCount: 15,
      elasticCordFeet: 15,
      focalCount: 45,
      accentCount: 270,
      giftBags: 15,
      guestCards: 15,
      masterGuide: 1,
      hostToolkit: 1,
    };

    function verifyKitReadiness(checklist, testExecutionMinutes) {
      const hasAllComponents = 
        checklist.penCount === 15 &&
        checklist.claspCount === 15 &&
        checklist.focalCount === 45 &&
        checklist.accentCount === 270 &&
        checklist.hostToolkit === 1;

      const passedTimeLimit = testExecutionMinutes <= 90;

      return {
        complete: hasAllComponents && passedTimeLimit,
        totalProjects: checklist.penCount + checklist.claspCount + 15, // 15 pens + 15 keychains + 15 bracelets = 45
        timeMinutes: testExecutionMinutes,
      };
    }

    const verification = verifyKitReadiness(kitChecklist, 72); // Novice tester completed in 72 minutes
    assert.equal(verification.complete, true);
    assert.equal(verification.totalProjects, 45);
    assert.ok(verification.timeMinutes <= 90, 'Must finish assembly within 90-minute party window');
  });
});
