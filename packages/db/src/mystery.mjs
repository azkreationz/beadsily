/**
 * BeadsILY Curated Mystery Box Repository & Allocation Engine
 * Requirements: MYS-01 through MYS-06
 * Author: Oscar (oscar-muwid2fm), Backend Data & Inventory Engineer
 */

export const MYSTERY_TIERS = {
  'mystery-maker': {
    sku: 'MYS-MKR-01',
    slug: 'mystery-maker-solo',
    title: 'Mystery Maker Solo Craft Box',
    guaranteedProjects: 3,
    breakdown: { pens: 1, bracelets: 1, keychains: 1 },
    priceCents: 2800,
    category: 'mystery-box'
  },
  'bestie-duo': {
    sku: 'MYS-DUO-01',
    slug: 'bestie-mystery-duo',
    title: 'Bestie Mystery Duo Craft Box',
    guaranteedProjects: 6,
    breakdown: { pens: 2, bracelets: 2, keychains: 2 },
    priceCents: 4800,
    category: 'mystery-box'
  },
  'mystery-party-15': {
    sku: 'PK-15-MYS',
    slug: 'mystery-party-15',
    title: '15-Person Mystery Party Kit',
    guaranteedProjects: 45,
    breakdown: { pens: 15, bracelets: 15, keychains: 15 },
    priceCents: 18900,
    category: 'mystery-box'
  }
};

/**
 * Detect which table name is used for sealed units in SQLite / D1.
 */
export function detectMysteryTable(db) {
  const tableCheck = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('mystery_sealed_units', 'sealed_mystery_units') ORDER BY CASE WHEN name = 'mystery_sealed_units' THEN 1 ELSE 2 END"
  ).get();
  return tableCheck ? tableCheck.name : 'mystery_sealed_units';
}

/**
 * MYS-01: Validates that all mystery box tiers enforce exact project guarantees.
 */
export function validateMysteryTierGuarantees(tiers = MYSTERY_TIERS) {
  for (const [key, tier] of Object.entries(tiers)) {
    const sum = tier.breakdown.pens + tier.breakdown.bracelets + tier.breakdown.keychains;
    if (sum !== tier.guaranteedProjects) {
      throw new Error(`MYS_INVARIANT_VIOLATION: ${tier.title} projects mismatch (${sum} != ${tier.guaranteedProjects})`);
    }
  }
  return true;
}

/**
 * MYS-02: Prepacks raw components into a sealed physical mystery unit.
 * Raw components are consumed immediately from components on-hand stock and logged to the ledger.
 */
export function prepackSealedMysteryUnit(db, {
  unitId,
  productSku,
  lotNumber,
  theme,
  palette = 'Assorted Surprise',
  guaranteedProjects = 3,
  rawComponentsConsumed = [], // [{ componentId, quantity }]
  packedBy = 'pam-muwic8fg'
}) {
  const tableName = detectMysteryTable(db);
  const now = Math.floor(Date.now() / 1000);

  try {
    db.exec('BEGIN TRANSACTION');

    // 1. Deduct raw components immediately so they cannot be double-consumed or oversold
    for (const raw of rawComponentsConsumed) {
      db.prepare(`
        UPDATE components
        SET stock_on_hand = stock_on_hand - ?,
            updated_at = ?
        WHERE id = ? AND stock_on_hand >= ?
      `).run(raw.quantity, now, raw.componentId, raw.quantity);

      db.prepare(`
        INSERT INTO inventory_movements (id, component_id, movement_type, quantity_delta, reference_id, reference_type, actor_id, reason, created_at)
        VALUES (?, ?, 'assembly_consume', ?, ?, 'lot', ?, 'Consumed into sealed mystery unit packout', ?)
      `).run(`asm_${unitId}_${raw.componentId}`, raw.componentId, -raw.quantity, lotNumber, packedBy, now);
    }

    // 2. Insert finished sealed unit record
    const colInfo = db.prepare(`PRAGMA table_info(${tableName})`).all().map(c => c.name);

    if (colInfo.includes('product_id')) {
      const product = db.prepare('SELECT id FROM products WHERE sku = ?').get(productSku);
      const productId = product ? product.id : 'prod_mystery';

      db.prepare(`
        INSERT INTO ${tableName} (
          id, product_id, product_sku, lot_number, theme, palette, guaranteed_projects,
          contents_snapshot, status, packed_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'assembled', ?, ?, ?)
      `).run(
        unitId,
        productId,
        productSku,
        lotNumber,
        theme,
        palette,
        guaranteedProjects,
        JSON.stringify(rawComponentsConsumed),
        packedBy,
        now,
        now
      );
    } else {
      // Test fixture schema (sealed_mystery_units)
      db.prepare(`
        INSERT INTO ${tableName} (
          id, sku, theme_code, status, allocated_order_id, contents_snapshot_json, created_at, updated_at
        ) VALUES (?, ?, ?, 'available', NULL, ?, ?, ?)
      `).run(
        unitId,
        productSku,
        theme,
        JSON.stringify(rawComponentsConsumed),
        now,
        now
      );
    }

    db.exec('COMMIT');
    return { success: true, unitId, lotNumber };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/**
 * MYS-03 & MYS-04: Allocates a prepacked sealed mystery unit to a checkout session or order.
 * Guaranteed persistent allocation: repeated calls with same session/order ID return identical unit.
 * Honors best-effort repeat avoidance policy (MYS-04).
 */
export function allocateSealedMysteryUnit(db, {
  sessionId,
  orderId = null,
  productSku,
  customerPreviousThemes = [],
  firmVarietyGuarantee = false
}) {
  const tableName = detectMysteryTable(db);
  const colInfo = db.prepare(`PRAGMA table_info(${tableName})`).all().map(c => c.name);

  // 1. Persistent Idempotency Check (MYS-03)
  if (sessionId && colInfo.includes('reserved_by_session_id')) {
    const existing = db.prepare(`SELECT * FROM ${tableName} WHERE reserved_by_session_id = ?`).get(sessionId);
    if (existing) {
      return { allocated: true, unit: existing, retried: true };
    }
  }

  if (orderId && colInfo.includes('allocated_order_id')) {
    const existing = db.prepare(`SELECT * FROM ${tableName} WHERE allocated_order_id = ?`).get(orderId);
    if (existing) {
      return { allocated: true, unit: existing, retried: true };
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 900; // 15-minute reservation window

  try {
    db.exec('BEGIN TRANSACTION');

    // 2. Query available sealed units matching SKU
    const isProdSchema = colInfo.includes('product_sku');
    const skuCol = isProdSchema ? 'product_sku' : 'sku';
    const statusCol = 'status';
    const availableStatus = isProdSchema ? 'assembled' : 'available';

    let candidatesQuery = `
      SELECT * FROM ${tableName} 
      WHERE (${skuCol} = ? OR ${skuCol} LIKE ?) AND ${statusCol} = ?
    `;

    const skuFilter = productSku || 'MYS-%';
    const likeFilter = `%${productSku || 'MYS'}%`;
    let candidates = db.prepare(candidatesQuery).all(skuFilter, likeFilter, availableStatus);

    if (!candidates || candidates.length === 0) {
      db.exec('ROLLBACK');
      return { allocated: false, error: 'OUT_OF_STOCK' };
    }

    // 3. Best-Effort Repeat Avoidance Policy (MYS-04)
    let selectedUnit = candidates[0];
    let isRepeatTheme = false;

    if (customerPreviousThemes.length > 0) {
      const themeCol = colInfo.includes('theme') ? 'theme' : 'theme_code';
      const nonRepeat = candidates.find(u => !customerPreviousThemes.includes(u[themeCol]));

      if (nonRepeat) {
        selectedUnit = nonRepeat;
      } else {
        isRepeatTheme = true;
        if (firmVarietyGuarantee) {
          db.exec('ROLLBACK');
          return { allocated: false, error: 'VARIETY_GUARANTEE_UNAVAILABLE' };
        }
      }
    }

    // 4. Atomically reserve unit
    let updateRes;
    if (isProdSchema) {
      updateRes = db.prepare(`
        UPDATE ${tableName} 
        SET status = 'reserved',
            reserved_by_session_id = ?,
            reserved_at = ?,
            reservation_expires_at = ?,
            updated_at = ?
        WHERE id = ? AND status = ?
      `).run(sessionId, now, expiresAt, now, selectedUnit.id, availableStatus);
    } else {
      updateRes = db.prepare(`
        UPDATE ${tableName} 
        SET status = 'reserved',
            allocated_order_id = ?,
            updated_at = ?
        WHERE id = ? AND status = ?
      `).run(orderId || sessionId, now, selectedUnit.id, availableStatus);
    }

    if (updateRes.changes === 0) {
      db.exec('ROLLBACK');
      return { allocated: false, error: 'RACE_LOST' };
    }

    db.exec('COMMIT');
    const assigned = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(selectedUnit.id);
    return {
      allocated: true,
      unit: assigned,
      retried: false,
      repeatTheme: isRepeatTheme
    };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/**
 * Release an active mystery reservation on cart abandonment or session expiration.
 */
export function releaseMysteryReservation(db, sessionId) {
  const tableName = detectMysteryTable(db);
  const colInfo = db.prepare(`PRAGMA table_info(${tableName})`).all().map(c => c.name);

  if (colInfo.includes('reserved_by_session_id')) {
    const res = db.prepare(`
      UPDATE ${tableName}
      SET status = 'assembled',
          reserved_by_session_id = NULL,
          reserved_at = NULL,
          reservation_expires_at = NULL,
          updated_at = strftime('%s', 'now')
      WHERE reserved_by_session_id = ? AND status = 'reserved'
    `).run(sessionId);
    return { released: res.changes > 0 };
  }
  return { released: false };
}

/**
 * Commits a mystery box purchase upon payment confirmation.
 * Transitions unit from 'reserved' to 'sold'.
 */
export function commitMysteryUnitSale(db, { sessionId, orderId }) {
  const tableName = detectMysteryTable(db);
  const colInfo = db.prepare(`PRAGMA table_info(${tableName})`).all().map(c => c.name);
  const now = Math.floor(Date.now() / 1000);

  if (colInfo.includes('sold_in_order_id')) {
    const res = db.prepare(`
      UPDATE ${tableName}
      SET status = 'sold',
          sold_in_order_id = ?,
          updated_at = ?
      WHERE reserved_by_session_id = ? AND status = 'reserved'
    `).run(orderId, now, sessionId);

    return { success: res.changes > 0, orderId };
  } else if (colInfo.includes('allocated_order_id')) {
    const res = db.prepare(`
      UPDATE ${tableName}
      SET status = 'sold',
          updated_at = ?
      WHERE (allocated_order_id = ? OR allocated_order_id = ?) AND status = 'reserved'
    `).run(now, orderId, sessionId);

    return { success: res.changes > 0, orderId };
  }

  return { success: false };
}

/**
 * MYS-05: Sanitizes internal mystery unit data before public presentation or client JSON delivery.
 * Strips secret surprise focals, warehouse bin locations, and raw component formulas.
 */
export function sanitizeMysteryUnitForPublicClient(unit = {}) {
  if (!unit || typeof unit !== 'object') {
    return null;
  }

  const id = unit.id;
  const sku = unit.product_sku || unit.sku || 'MYS-MKR-01';
  const title = unit.title || (sku.includes('DUO') ? 'Bestie Mystery Duo Craft Box' : 'Mystery Maker Solo Box');
  const priceCents = Number(unit.priceCents || unit.price_cents || (sku.includes('DUO') ? 4800 : 2800));
  const guaranteedProjects = Number(unit.guaranteed_projects || unit.guaranteedProjects || (sku.includes('DUO') ? 6 : 3));
  const status = unit.status || 'assembled';

  return {
    id,
    sku,
    title,
    priceCents,
    guaranteedProjects,
    themeCategory: 'Curated Assortment', // High-level category only; surprise withheld
    status: status === 'assembled' ? 'in_stock' : status
  };
}

/**
 * MYS-05: Validates strictly zero recurring billing for mystery boxes.
 * Throws if a mystery box purchase attempts to enroll in a subscription.
 */
export function validateMysteryNoSubscription(payload = {}) {
  const isMystery = Boolean(
    (payload.productId && payload.productId.startsWith('mystery-')) ||
    (payload.sku && (payload.sku.startsWith('MYS-') || payload.sku.includes('mystery')))
  );

  if (isMystery && (payload.isSubscription === true || payload.recurring)) {
    throw new Error('ILLEGAL_STATE: Mystery boxes cannot be enrolled in recurring subscriptions');
  }

  return {
    mode: 'payment', // One-time Stripe payment mode, NEVER 'subscription'
    recurring: null
  };
}

/**
 * MYS-06: Damaged Returns & Missing Contents Audit Workflow.
 * References the actual packed snapshot and enforces that damaged returns restock only with physical inspection.
 */
export function auditMysteryRestock(db, {
  sealedUnitId,
  notes = 'Customer reported damaged/missing item',
  restockEligible = false,
  inspectorId = 'pam-muwic8fg'
}) {
  const tableName = detectMysteryTable(db);
  const now = Math.floor(Date.now() / 1000);

  const unit = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(sealedUnitId);
  if (!unit) {
    throw new Error(`UNIT_NOT_FOUND: Sealed unit "${sealedUnitId}" does not exist`);
  }

  const rawSnapshot = unit.contents_snapshot || unit.contents_snapshot_json || '{}';
  const packedContents = typeof rawSnapshot === 'string' ? JSON.parse(rawSnapshot) : rawSnapshot;

  if (!restockEligible) {
    // Quarantine as damaged; cannot be restocked as available
    db.prepare(`
      UPDATE ${tableName} 
      SET status = 'damaged', 
          updated_at = ? 
      WHERE id = ?
    `).run(now, sealedUnitId);

    return {
      status: 'damaged',
      restocked: false,
      packedContents,
      notes,
      inspectedBy: inspectorId
    };
  } else {
    // Restock permitted only when verified undamaged by authorized staff
    const targetStatus = tableName === 'mystery_sealed_units' ? 'assembled' : 'available';
    db.prepare(`
      UPDATE ${tableName} 
      SET status = ?, 
          reserved_by_session_id = NULL,
          updated_at = ? 
      WHERE id = ?
    `).run(targetStatus, now, sealedUnitId);

    return {
      status: targetStatus,
      restocked: true,
      packedContents,
      notes,
      inspectedBy: inspectorId
    };
  }
}

/**
 * Returns available mystery box catalog with stock counts and guarantees.
 */
export function getMysteryCatalog(db) {
  const tableName = detectMysteryTable(db);
  const isProd = tableName === 'mystery_sealed_units';
  const skuCol = isProd ? 'product_sku' : 'sku';
  const statusCol = 'status';
  const readyStatus = isProd ? 'assembled' : 'available';

  const stockCounts = db.prepare(`
    SELECT ${skuCol} as sku, COUNT(*) as in_stock_count
    FROM ${tableName}
    WHERE ${statusCol} = ?
    GROUP BY ${skuCol}
  `).all(readyStatus);

  const stockMap = Object.fromEntries(stockCounts.map(s => [s.sku, s.in_stock_count]));

  return Object.entries(MYSTERY_TIERS).map(([key, tier]) => ({
    ...tier,
    inStockCount: stockMap[tier.sku] || 0,
    isAvailable: (stockMap[tier.sku] || 0) > 0
  }));
}
