# BeadsILY Component Inventory & BOM Modeling Specification

**Document Version:** 1.1.0  
**Date:** October 6, 2026  
**Status:** APPROVED (incorporates Toby's Independent QA Review `4133e2f`)  
**Lead:** Pam (`pam-muwic8fg`), Product Operations Lead & Oscar (`oscar-muwid2fm`), Backend Inventory  
**Reviewer:** Toby (`toby-muwie8nd`), Independent QA Certifier  
**Intake Reference:** [`INVENTORY-INTAKE.csv`](file:///C:/repositories/beadsily-com-floor/worktrees/pam-muwic8fg/docs/inventory/INVENTORY-INTAKE.csv)  
**Launch Catalog & BOM:** [`LAUNCH-CATALOG-AND-BOM-SPECIFICATION.md`](file:///C:/repositories/beadsily-com-floor/worktrees/pam-muwic8fg/docs/inventory/LAUNCH-CATALOG-AND-BOM-SPECIFICATION.md)  
**Matrix Requirements:** `INV-01` through `INV-09`, `CAT-01`, `CAT-02`, `CAT-03`

---

## 1. Core Principles & Anti-Patterns

1. **No Image-Derived Counts:** Inventory numbers are established exclusively through human physical counts and supplier invoices. Photographic groupings identify assortment variety, not saleable stock.
2. **Component-Aware Accounting:** BeadsILY tracks inventory at the component level: bead sizes (8mm, 10mm, 12mm, 14mm, 15mm), focal silicone designs, pen rods, elastic cord, clasps, keyrings, packaging, and shared assembly tools.
3. **No Double-Counting:** 
   - When components are assembled into prepacked kits or sealed mystery boxes, raw components are consumed and finished stock is credited.
   - Selling a finished kit consumes the finished item; it never deducts raw components a second time.
4. **Shared Component Pool:** Party kits, monthly boxes, mystery boxes, and school booth stock draw from a single authoritative D1 ledger.

---

## 2. Component Schema (D1 Migration Specification)

```sql
-- Components Table (Raw Materials)
CREATE TABLE components (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bead', 'focal', 'hardware', 'pen', 'cord', 'packaging', 'tool')),
  sub_category TEXT,
  material TEXT,
  color TEXT,
  size_mm REAL,
  hole_size_mm REAL,
  letter TEXT,
  unit_of_measure TEXT NOT NULL DEFAULT 'piece',
  cost_per_unit_cents INTEGER NOT NULL,
  stock_on_hand INTEGER NOT NULL DEFAULT 0,
  stock_reserved INTEGER NOT NULL DEFAULT 0,
  safety_stock INTEGER NOT NULL DEFAULT 0,
  bin_location TEXT,
  supplier_ref TEXT,
  updated_at INTEGER NOT NULL,
  -- Toby QA Mandate: Database-enforced atomic invariant
  CHECK (stock_reserved >= 0),
  CHECK ((stock_on_hand - stock_reserved - safety_stock) >= 0)
);

-- Products & Finished Goods
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('party_kit', 'monthly_box', 'mystery_box', 'finished_good')),
  base_guest_count INTEGER NOT NULL DEFAULT 1,
  projects_per_guest INTEGER NOT NULL DEFAULT 3,
  price_cents INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);

-- Bills of Materials (BOM)
CREATE TABLE bill_of_materials (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  component_id TEXT NOT NULL REFERENCES components(id),
  quantity_per_guest REAL NOT NULL DEFAULT 0,
  fixed_kit_quantity INTEGER NOT NULL DEFAULT 0,
  safety_spare_quantity INTEGER NOT NULL DEFAULT 0,
  is_substitutable INTEGER NOT NULL DEFAULT 0,
  substitute_component_id TEXT REFERENCES components(id)
);

-- Append-Only Inventory Movement Ledger
CREATE TABLE inventory_movements (
  id TEXT PRIMARY KEY,
  component_id TEXT NOT NULL REFERENCES components(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'receipt', 'assembly_consume', 'assembly_produce', 'reservation_lock', 
    'reservation_release', 'sale_consume', 'booth_sale', 'damage', 'correction', 'return_restock'
  )),
  quantity_delta INTEGER NOT NULL,
  reference_id TEXT, -- Order ID, Assembly Lot ID, Receipt ID
  actor_id TEXT NOT NULL, -- User/Worker who performed the action
  reason TEXT,
  created_at INTEGER NOT NULL
);
```

---

## 3. Bill of Materials (BOM) Calculation: 15-Guest Party Kit

A standard 15-guest BeadsILY Party Kit guarantees **45 finished projects** (3 per guest: 1 bracelet, 1 beadable pen, 1 backpack keychain charm):

| Supply Item | Allocation Rule | Formula (15 Guests) | Total Quantity Needed |
| :--- | :--- | :--- | :--- |
| **Beadable Pen Blanks** | 1 per guest | `15 * 1 + 1 spare` | 16 pens |
| **Keyring Hardware & Clasps** | 1 per guest | `15 * 1 + 1 spare` | 16 clasp sets |
| **Elastic Stretch Cord** | 12 inches per guest | `15 * 12" + 36" spare` | 18 strands (18 ft) |
| **Theme Focal Silicone Beads** | 3 per guest (1/project) | `15 * 3 + 3 spares` | 48 focals |
| **Accent & Spacer Beads (12mm/15mm)**| 16 per guest | `15 * 16 + 25 spares` | 265 beads |
| **Crystal Rhinestone Rondelles (8mm)**| 2 per guest | `15 * 2 + 5 spares` | 35 rondelles |
| **Letter / Alphabet Beads** | Pooled allowance | Pooled allowance | 60 letters (pooled) |
| **Host Tool Kit (Shared)** | Fixed per kit box | Fixed `1` | 2 scissors, 2 trays, 1 tape |
| **Individual Guest Gift Bags** | 1 per guest | `15 * 1 + 1 spare` | 16 organza bags |
| **Host Master Guide & Cards** | 1 guide + 15 cards | Fixed | 1 master guide, 15 cards |

---

## 4. Atomic Multi-Component Reservation Algorithm (INV-01, INV-02)

Following Toby's QA review, reservation atomicity is enforced directly at the SQLite engine level using a `CHECK` constraint:

```sql
-- D1 Batch Execution: env.DB.batch([stmt1, stmt2, ...])
UPDATE components 
SET stock_reserved = stock_reserved + :qty_needed,
    updated_at = :now
WHERE id = :component_id;
```

**Atomicity Guarantee:**
If any component in the kit does not have sufficient available stock (`stock_on_hand - stock_reserved - safety_stock < :qty_needed`), the update triggers `SQLITE_CONSTRAINT_CHECK`.
Because Cloudflare D1 automatically rolls back all statements in an `env.DB.batch()` when any single statement fails, **either 100% of the kit components are successfully reserved, or 0 components are locked**. This completely eliminates partial reservations and race conditions under concurrent cart checkouts (`INV-01`, `INV-02`).
