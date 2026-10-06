# BeadsILY Component Inventory & BOM Modeling Specification

**Date:** October 6, 2026  
**Status:** PROPOSED  
**Lead:** Pam (Product Operations) & Oscar (Backend Inventory)  
**Reviewer:** Toby (Independent QA)  
**Intake Reference:** [`templates/INVENTORY-INTAKE.csv`](file:///C:/repositories/beadsily-com-floor/templates/INVENTORY-INTAKE.csv)  
**Matrix Requirements:** `INV-01` through `INV-09`

---

## 1. Core Principles & Anti-Patterns

1. **No Image-Derived Counts:** Inventory numbers are established exclusively through human physical counts and supplier invoices. Photographic groupings identify assortment variety, not saleable stock.
2. **Component-Aware Accounting:** BeadsILY tracks inventory at the component level: bead sizes (8mm, 10mm, 12mm, 14mm), focal silicone designs, pen rods, elastic cord, clasps, keyrings, packaging, and shared assembly tools.
3. **No Double-Counting:** 
   - When components are assembled into prepacked kits or sealed mystery boxes, raw components are consumed and finished stock is credited.
   - Selling a finished kit consumes the finished item; it never deducts raw components a second time.
4. **Shared Component Pool:** Party kits, monthly boxes, mystery boxes, and school booth stock draw from a single authoritative D1 ledger.

---

## 2. Component Schema (D1 Migration Draft)

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
  letter TEXT,
  unit_of_measure TEXT NOT NULL DEFAULT 'piece',
  cost_per_unit_cents INTEGER NOT NULL,
  stock_on_hand INTEGER NOT NULL DEFAULT 0,
  stock_reserved INTEGER NOT NULL DEFAULT 0 CHECK (stock_reserved >= 0),
  safety_stock INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT chk_available_stock CHECK ((stock_on_hand - stock_reserved - safety_stock) >= 0),
  bin_location TEXT,
  supplier_ref TEXT,
  updated_at INTEGER NOT NULL
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
| **Beadable Pen Blanks** | 1 per guest | `15 * 1` | 15 pens |
| **Keyring Hardware & Clasps** | 1 per guest | `15 * 1` | 15 clasp sets |
| **Elastic Stretch Cord** | 12 inches per guest | `15 * 12"` | 180 inches (15 ft) |
| **Theme Focal Silicone Beads** | 3 per guest (1/project) | `15 * 3` | 45 focals |
| **Accent & Spacer Beads (12mm/14mm)**| 18 per guest | `15 * 18` | 270 beads |
| **Letter / Alphabet Beads** | Optional personalization | Pooled allowance or exact | 60 letters (pooled) |
| **Host Tool Kit (Shared)** | Fixed per kit box | Fixed `1` | 2 scissors, 2 bead trays |
| **Individual Guest Gift Bags** | 1 per guest | `15 * 1` | 15 organza bags |
| **Host Master Guide & Cards** | 1 guide + 15 cards | Fixed | 1 master guide, 15 cards |

---

## 4. Atomic Multi-Component Reservation Algorithm (INV-01, INV-02)

To prevent overselling when multiple buyers race for limited stock:

```sql
-- Step 1: Execute atomic reservations for every component in the BOM
-- The WHERE clause ensures stock_on_hand - stock_reserved >= required_quantity
UPDATE components 
SET stock_reserved = stock_reserved + :qty_needed,
    updated_at = :now
WHERE id = :component_id 
  AND (stock_on_hand - stock_reserved - safety_stock) >= :qty_needed;

-- Step 2: Verification Invariant
-- If changes() == 0 (zero rows updated), the component is short.
-- Roll back all prior component updates in this batch immediately!
```

This strictly enforces that either the **entire kit** is reserved, or **zero components** are locked, satisfying `INV-02` without partial stock leakage.
