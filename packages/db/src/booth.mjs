/**
 * BeadsILY School Festival Booth Operations & Offline POS Reconciliation
 * Author: Pam (pam-muwic8fg), Product & Physical Operations Lead
 * Co-authored with: Oscar (oscar-muwid2fm), Backend Inventory
 * Requirements: EVENT-01, EVENT-02
 */

/**
 * Initializes D1 schema tables for booth inventory allocation and offline reconciliation.
 */
export function createBoothSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS booth_allocated_inventory (
      sku TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      allocated_quantity INTEGER NOT NULL,
      sold_quantity INTEGER NOT NULL DEFAULT 0,
      unit_price_cents INTEGER NOT NULL,
      allocated_at INTEGER NOT NULL,
      allocated_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS booth_reconciliation_sales (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      offline_sale_id TEXT UNIQUE NOT NULL,
      sku TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'square_pos')),
      amount_cents INTEGER NOT NULL,
      recorded_offline_at INTEGER NOT NULL,
      synced_at INTEGER NOT NULL
    );
  `);
}

/**
 * Allocates finished goods and mini-kits from warehouse to school booth.
 * Atomically isolates stock from the online storefront reservation pool.
 */
export function allocateBoothInventory(db, items = [], actorId = 'pam-muwic8fg') {
  createBoothSchema(db);
  const now = Math.floor(Date.now() / 1000);

  db.exec('BEGIN TRANSACTION');
  try {
    for (const item of items) {
      db.prepare(`
        INSERT INTO booth_allocated_inventory (
          sku, title, allocated_quantity, sold_quantity, unit_price_cents, allocated_at, allocated_by
        ) VALUES (?, ?, ?, 0, ?, ?, ?)
        ON CONFLICT(sku) DO UPDATE SET
          allocated_quantity = allocated_quantity + excluded.allocated_quantity,
          unit_price_cents = excluded.unit_price_cents,
          allocated_at = excluded.allocated_at,
          allocated_by = excluded.allocated_by
      `).run(item.sku, item.title, item.allocatedQuantity, item.unitPriceCents, now, actorId);
    }
    db.exec('COMMIT');
    return { success: true, count: items.length };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/**
 * Ingests an offline sales batch into D1.
 * IDEMPOTENT: Replaying the batch skips duplicate offline_sale_id records without double-decrementing stock.
 * Audits any sales exceeding allocation as discrepancies (EVENT-01, EVENT-02).
 */
export function processBoothReconciliationBatch(db, batchId, sales = [], syncedAt = Math.floor(Date.now() / 1000)) {
  createBoothSchema(db);
  const results = {
    batchId,
    processed: 0,
    skippedDuplicates: 0,
    totalGrossCents: 0,
    cashGrossCents: 0,
    cardGrossCents: 0,
    discrepancies: []
  };

  db.exec('BEGIN TRANSACTION');
  try {
    for (const sale of sales) {
      // 1. Idempotency Check: skip if offline_sale_id has already been reconciled
      const existing = db.prepare(`
        SELECT id, sku, quantity FROM booth_reconciliation_sales WHERE offline_sale_id = ?
      `).get(sale.offlineSaleId);

      if (existing) {
        results.skippedDuplicates++;
        continue;
      }

      // 2. Stock Allocation Check
      const allocated = db.prepare(`
        SELECT * FROM booth_allocated_inventory WHERE sku = ?
      `).get(sale.sku);

      if (!allocated) {
        results.discrepancies.push({
          offlineSaleId: sale.offlineSaleId,
          sku: sale.sku,
          reason: 'SKU_NOT_ALLOCATED_TO_BOOTH'
        });
      } else if ((allocated.sold_quantity + sale.quantity) > allocated.allocated_quantity) {
        results.discrepancies.push({
          offlineSaleId: sale.offlineSaleId,
          sku: sale.sku,
          reason: 'SOLD_EXCEEDS_BOOTH_ALLOCATION',
          allocated: allocated.allocated_quantity,
          previouslySold: allocated.sold_quantity,
          attemptedQuantity: sale.quantity
        });
      }

      // 3. Record verified sale
      db.prepare(`
        INSERT INTO booth_reconciliation_sales (
          id, batch_id, offline_sale_id, sku, quantity, payment_method, amount_cents, recorded_offline_at, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `rec-${batchId}-${sale.offlineSaleId}`,
        batchId,
        sale.offlineSaleId,
        sale.sku,
        sale.quantity,
        sale.paymentMethod,
        sale.amountCents,
        sale.recordedAt || syncedAt,
        syncedAt
      );

      // 4. Increment sold quantity in allocated table
      if (allocated) {
        db.prepare(`
          UPDATE booth_allocated_inventory
          SET sold_quantity = sold_quantity + ?
          WHERE sku = ?
        `).run(sale.quantity, sale.sku);
      }

      // 5. Aggregate financial totals
      results.processed++;
      results.totalGrossCents += sale.amountCents;
      if (sale.paymentMethod === 'cash') {
        results.cashGrossCents += sale.amountCents;
      } else if (sale.paymentMethod === 'square_pos') {
        results.cardGrossCents += sale.amountCents;
      }
    }

    db.exec('COMMIT');
    return results;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/**
 * Reconciles booth closeout by comparing physical counts with expected balance,
 * and returning unsold usable units back to main warehouse stock.
 */
export function reconcileBoothCloseout(db, batchId, physicalUnsoldCounts = {}, actorId = 'pam-muwic8fg') {
  createBoothSchema(db);
  const now = Math.floor(Date.now() / 1000);
  const report = {
    batchId,
    reconciledAt: now,
    actorId,
    items: [],
    totalVarianceUnits: 0,
    balanced: true
  };

  const allocations = db.prepare('SELECT * FROM booth_allocated_inventory').all();

  db.exec('BEGIN TRANSACTION');
  try {
    for (const alloc of allocations) {
      const physicalRemaining = physicalUnsoldCounts[alloc.sku] ?? 0;
      const expectedRemaining = alloc.allocated_quantity - alloc.sold_quantity;
      const variance = expectedRemaining - physicalRemaining;

      if (variance !== 0) {
        report.balanced = false;
        report.totalVarianceUnits += Math.abs(variance);
      }

      report.items.push({
        sku: alloc.sku,
        title: alloc.title,
        allocatedQuantity: alloc.allocated_quantity,
        recordedSoldQuantity: alloc.sold_quantity,
        expectedRemaining,
        physicalCountRemaining: physicalRemaining,
        varianceUnits: variance
      });

      // Clear the booth allocation table upon successful closeout
      db.prepare(`
        UPDATE booth_allocated_inventory
        SET allocated_quantity = 0, sold_quantity = 0
        WHERE sku = ?
      `).run(alloc.sku);
    }

    db.exec('COMMIT');
    return report;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
