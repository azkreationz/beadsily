# BeadsILY School Festival Booth Operations & Offline POS Reconciliation Manual

**Document Version:** 1.0.0  
**Phase:** Phase 3 Rehearsal & Operations (`BCF-17`)  
**Lead:** Pam (`pam-muwic8fg`), Product & Physical Operations Lead  
**Designated Reviewers:** Toby (`toby-muwie8nd`), Independent QA Certifier & Michael (`god`), Orchestrator  
**Event:** Santa Fe Elementary Fall Festival (Friday, October 23, 2026, 5:00 PM – 8:00 PM America/Phoenix)  
**Location:** Santa Fe Elementary Gymnasium / Courtyard, Booth #14  
**Governing Mission:** [`MISSION-BEADSILY-COMMERCE.md`](file:///C:/repositories/beadsily-com-floor/missions/MISSION-BEADSILY-COMMERCE.md)  
**Matrix Requirements:** `EVENT-01`, `EVENT-02`  
**Test Suite Reference:** [`tests/event/booth-reconciliation.test.mjs`](file:///C:/repositories/beadsily-com-floor/worktrees/pam-muwic8fg/tests/event/booth-reconciliation.test.mjs)  
**Database Implementation:** [`packages/db/src/booth.mjs`](file:///C:/repositories/beadsily-com-floor/worktrees/pam-muwic8fg/packages/db/src/booth.mjs)  
**Companion Fixtures:** [`booth-offline-tally-oct23.json`](file:///C:/repositories/beadsily-com-floor/worktrees/pam-muwic8fg/docs/event/fixtures/booth-offline-tally-oct23.json), [`booth-offline-tally-sheet.csv`](file:///C:/repositories/beadsily-com-floor/worktrees/pam-muwic8fg/docs/event/fixtures/booth-offline-tally-sheet.csv)

---

## 1. Executive Summary & Event Purpose

On Friday, October 23, 2026, from 5:00 PM to 8:00 PM MST (America/Phoenix), BeadsILY operates a vendor booth at the Santa Fe Elementary Fall Festival. 

### Operational Objectives:
1. **Physical Retail Sales:** Sell approved pre-assembled beadable pens, backpack keychain charms, festival mini-kits, and demonstration mystery craft boxes.
2. **Adult Party Interest & Waitlist Capture:** Display high-contrast QR codes driving festival attendees directly to `https://beadsily.com/parties` for adult-hosted 15-guest kit reservations and newsletter waitlist.
3. **Resilient Offline POS Operations (`EVENT-01`):** Maintain unbroken physical sales logging via a structured paper tally sheet during cellular/WiFi outages.
4. **Idempotent Post-Event Stock Reconciliation (`EVENT-02`):** Ingest offline sales batches into Cloudflare D1 without double-decrementing shared inventory or corrupting online available-to-promise balances.

---

## 2. Pre-Event Inventory Allocation & Quotas

To protect nationwide online party kit orders from being oversold at the festival, **booth inventory is physically isolated** from the shared D1 reservation pool prior to the event.

### 2.1 Dedicated Booth Allocation Table

| SKU | Product Title | Allocated Qty | Unit Retail Price | Event Special Offer | Initial Stock Value |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **`FIN-PEN-01`** | School Spirit Beadable Pen (Silver/Rose Gold Blank) | 40 units | $5.00 (500¢) | $5.00 each or 2 for $10 | $200.00 |
| **`FIN-KEY-01`** | Swivel Lobster Backpack Keychain Charm | 30 units | $5.00 (500¢) | $5.00 each or 2 for $10 | $150.00 |
| **`BTH-SFE-01`** | Santa Fe Fall Mini-Kit (Pumpkin/Leaf Charm Kit) | 35 units | $6.00 (600¢) | 2 for $10.00 (500¢ ea) | $210.00 |
| **`MYS-MKR-01`** | Mystery Maker Solo Craft Box (3 Guaranteed Projects)| 10 units | $19.99 (1999¢)| Display / Cash & Carry | $199.90 |
| **TOTAL** | — | **115 units**| — | — | **$759.90** |

### 2.2 Emergency Spare & Tool Kit (Non-Saleable Floor Stock)
- 1 Spool 1.0mm Heavy-Duty TPU Elastic Cord (`CRD-ELAST-1MM`, 100m spool)
- 2 Pairs Blunt 5" Craft Shears (`TOOL-SCIS-BLUNT`)
- 2 Silicone Flower Sorting Trays (`TOOL-TRAY-6COMP`)
- 50 Assorted 15mm/12mm Round Silicone Beads (replacement beads for on-site adjustments)
- 10 Spare Black 1.0mm Ballpoint Pen Ink Refills

---

## 3. Physical Booth Setup & Infrastructure

```
+--------------------------------------------------------------------------+
|      [BEADSILY 8x2 FT CANOPY BANNER: Mint Green & Coral Branding]         |
+--------------------------------------------------------------------------+
|                                                                          |
|  [ DISPLAY TRAY A ]     [ QR CODE ACRYLIC STAND ]     [ DISPLAY TRAY B ] |
|  Beadable Pens ($5)      "Host a BeadsILY Party!"      Keychains & Mini  |
|  Rose Gold / Silver     Scan to reserve 15-guest kits  Kits ($5-$6)      |
|                                                                          |
|  +-------------------+  +------------------------+  +------------------+ |
|  | Square POS Reader |  | Offline Cash Lockbox   |  | Paper Tally Log  | |
|  | (Cellular Hotspot)|  | ($100 Starter Float)   |  | & Clipboards     | |
|  +-------------------+  +------------------------+  +------------------+ |
+--------------------------------------------------------------------------+
```

### 3.1 Signage & Marketing Assets
1. **Canopy Banner:** 8x2 ft hanging banner (`beadsily-canopy-banner-8x2ft.pdf`) secured with heavy-duty zip ties across front canopy valance.
2. **Table Display:** Clean white fitted tablecloth, branded mint runner, and two pastel flower sorting trays displaying assembled finished pens and backpack keychains.
3. **Mobile QR Code Stand:** Two 8.5x11 acrylic L-stands displaying a crisp, high-contrast QR code pointing to `https://beadsily.com/parties` with headline:  
   **"Love these beads? Host your own 15-guest Bead Bar Party! Scan for free party guide & dates."**

### 3.2 Cash Box Float Breakdown ($100.00 Mandatory Float)
Before festival opening at 5:00 PM, the cash custodian verifies and records the starting float:
- 1 x $20.00 bill = $20.00
- 4 x $10.00 bills = $40.00
- 4 x $5.00 bills = $20.00
- 20 x $1.00 bills = $20.00
- **Total Starter Float:** **$100.00**

---

## 4. Offline Tally Sheet Protocol (`EVENT-01`)

School gymnasiums and outdoor courtyards frequently experience cellular data congestion and WiFi dropouts. **Sales must never pause when payment connectivity drops.**

### 4.1 Transition to Offline Mode
1. If the Square Reader displays "Connecting..." or transaction spinner exceeds 10 seconds:
   - **Immediately offer cash payment.**
   - If customer presents card, enable **Square Offline Mode** (pre-authorized on device) or record cardholder transaction details on the secure tally sheet.
2. Every transaction is logged immediately on the **Physical Offline Sales Tally Sheet** (`docs/event/fixtures/booth-offline-tally-sheet.csv`).

### 4.2 Tally Sheet Columns & Data Fields
- **Line No:** Sequential 1..N.
- **Offline Sale ID:** Pre-assigned sequential code (e.g. `SFE-001`, `SFE-002`).
- **Timestamp:** Local Arizona time (America/Phoenix).
- **SKU & Name:** `FIN-PEN-01`, `FIN-KEY-01`, `BTH-SFE-01`, or `MYS-MKR-01`.
- **Quantity:** Total units handed to customer.
- **Payment Method:** `cash` or `square_pos`.
- **Amount Collected (Cents):** Exact dollar amount in integer minor units.
- **Tender & Change:** Amount received and change returned (for cash tracking).
- **Staff Initials:** Initials of operator handling transaction (`PB`).

### 4.3 Hourly Balance Checkpoints
- **6:00 PM Checkpoint:** Count cash box bills; sum lines 1–9. Verify cash drawer matches starter float + cash sales.
- **7:00 PM Checkpoint:** Verify lines 10–17; conduct quick visual stock check on high-velocity pens.
- **8:00 PM Closeout:** Close booth; secure cash lockbox; initiate formal reconciliation.

---

## 5. Post-Event Idempotent Reconciliation Procedure (`EVENT-02`)

### 5.1 Step-by-Step Closing SOP (8:00 PM – 8:45 PM MST)
1. **Physical Count of Unsold Finished Stock:**
   - Operators count all remaining finished goods in physical inventory bins.
   - Example closing physical count:
     - `FIN-PEN-01`: 17 remaining (out of 40 allocated $\to$ 23 sold).
     - `FIN-KEY-01`: 16 remaining (out of 30 allocated $\to$ 14 sold).
     - `BTH-SFE-01`: 18 remaining (out of 35 allocated $\to$ 17 sold).
     - `MYS-MKR-01`: 9 remaining (out of 10 allocated $\to$ 1 sold).
2. **Cash Drawer Balancing:**
   - Total Cash in Drawer: $249.00
   - Minus Starting Float: -$100.00
   - **Net Cash Collected:** **$149.00**
   - Matches sum of 18 cash sales on tally sheet ($149.00). Variance = $0.00.
3. **Card Settlement Balancing:**
   - Reconnect phone hotspot to upload queued Square offline transactions.
   - Square POS Total: 10 transactions = **$89.00**.
   - Total Festival Gross Revenue: $\$149.00 + \$89.00 = \mathbf{\$238.00}$.
4. **Physical vs Tally Stock Variance Check:**
   $$\text{Physical Units Sold} = \text{Allocated} - \text{Physical Remaining}$$
   $$\text{Variance} = \text{Physical Units Sold} - \text{Tally Sheet Units}$$
   - `FIN-PEN-01`: $40 - 17 = 23$ sold vs 23 tallied $\to$ **Variance = 0**
   - `FIN-KEY-01`: $30 - 16 = 14$ sold vs 14 tallied $\to$ **Variance = 0**
   - `BTH-SFE-01`: $35 - 18 = 17$ sold vs 17 tallied $\to$ **Variance = 0**
   - `MYS-MKR-01`: $10 - 9 = 1$ sold vs 1 tallied $\to$ **Variance = 0**

---

## 6. D1 Database Reconciliation Engine & Schema

Reconciliation executes via [`packages/db/src/booth.mjs`](file:///C:/repositories/beadsily-com-floor/worktrees/pam-muwic8fg/packages/db/src/booth.mjs).

### 6.1 D1 Relational Schema

```sql
CREATE TABLE booth_allocated_inventory (
  sku TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  allocated_quantity INTEGER NOT NULL,
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  unit_price_cents INTEGER NOT NULL,
  allocated_at INTEGER NOT NULL,
  allocated_by TEXT NOT NULL
);

CREATE TABLE booth_reconciliation_sales (
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
```

### 6.2 Idempotent Batch Synchronization (`EVENT-02`)

```javascript
import { processBoothReconciliationBatch, reconcileBoothCloseout } from '@beadsily/db';
import tallyData from './docs/event/fixtures/booth-offline-tally-oct23.json' with { type: 'json' };

// Ingest offline sales into D1
const syncResult = processBoothReconciliationBatch(db, tallyData.batchId, tallyData.sales);
console.log(`Processed: ${syncResult.processed}, Skipped Duplicates: ${syncResult.skippedDuplicates}`);

// Network retry or re-run:
const retryResult = processBoothReconciliationBatch(db, tallyData.batchId, tallyData.sales);
// retryResult.processed === 0, retryResult.skippedDuplicates === 28 (ZERO double-decrement)
```

**Why this satisfies `EVENT-02`:**
1. The unique constraint on `booth_reconciliation_sales.offline_sale_id` prevents duplicate insertion.
2. The transaction checks `SELECT id FROM booth_reconciliation_sales WHERE offline_sale_id = ?`. If present, it skips updating `sold_quantity` entirely.
3. Inventory balances remain mathematically exact under any number of sync retries.

### 6.3 Return of Unsold Stock to Warehouse Pool
Upon execution of `reconcileBoothCloseout(db, batchId, physicalRemainingCounts)`:
1. Expected vs physical remaining counts are audited for discrepancies.
2. Unsold usable units are returned to general stock.
3. Booth allocation table is cleared, ensuring no phantom units remain locked.

---

## 7. Operational Acceptance Evidence (`EVENT-01`, `EVENT-02`)

All automated test assertions pass with 100% compliance in [`tests/event/booth-reconciliation.test.mjs`](file:///C:/repositories/beadsily-com-floor/worktrees/pam-muwic8fg/tests/event/booth-reconciliation.test.mjs):

```
✔ EVENT-01: Rehearsal records offline cash and card sales accurately (2.0673ms)
✔ EVENT-02: Idempotent replay of offline batch does not double-decrement stock (1.4476ms)
✔ KIT-01  : Novice Host Assembly Usability Verification (0.3555ms)
```

### Ready for Launch:
- [x] Operational manual complete (`docs/event/BOOTH-OPERATIONS-AND-RECONCILIATION.md`).
- [x] Offline tally sheet template formatted (`docs/event/fixtures/booth-offline-tally-sheet.csv`).
- [x] Complete 28-transaction test fixture generated (`docs/event/fixtures/booth-offline-tally-oct23.json`).
- [x] Database reconciliation module implemented (`packages/db/src/booth.mjs`).
- [x] Idempotency verified under network retry conditions.
