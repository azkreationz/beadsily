-- Migration 0001: Initial Relational Schema for BeadsILY Commerce Platform
-- Author: Oscar (oscar-muwid2fm), Backend Data & Inventory Engineer
-- Target: Cloudflare D1 (SQLite)
-- Mission Reference: MISSION-BEADSILY-COMMERCE.md (v1.1.0)
-- Matrix Requirements: INV-01, INV-02, INV-03, INV-04, INV-05, INV-06, INV-08, INV-09, PAY-03, PAY-04, MYS-01, MYS-02, MYS-03

PRAGMA foreign_keys = ON;

-- 1. Components (Raw Materials & Inventory Balances)
CREATE TABLE IF NOT EXISTS components (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bead', 'focal', 'hardware', 'pen', 'cord', 'packaging', 'tool')),
  sub_category TEXT,
  material TEXT,
  color TEXT,
  size_mm REAL,
  hole_size_mm REAL,
  alphabet_character TEXT,
  unit_of_measure TEXT NOT NULL DEFAULT 'piece',
  units_per_pack INTEGER NOT NULL DEFAULT 1,
  cost_per_unit_cents INTEGER NOT NULL,
  stock_on_hand INTEGER NOT NULL DEFAULT 0,
  stock_reserved INTEGER NOT NULL DEFAULT 0,
  safety_stock INTEGER NOT NULL DEFAULT 0,
  bin_location TEXT,
  supplier TEXT,
  supplier_ref TEXT,
  compatibility_notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  -- Engine-level invariant: stock_reserved can never be negative,
  -- and available stock (on_hand - reserved - safety_stock) cannot drop below zero.
  -- This forces D1 batch rollback if any statement causes over-reservation.
  CHECK (stock_reserved >= 0),
  CHECK ((stock_on_hand - stock_reserved - safety_stock) >= 0)
);

-- Trigger for descriptive error message when reservation exceeds capacity
CREATE TRIGGER IF NOT EXISTS trg_check_stock_reserved
BEFORE UPDATE OF stock_reserved ON components
WHEN NEW.stock_reserved > (NEW.stock_on_hand - NEW.safety_stock)
BEGIN
  SELECT RAISE(ABORT, 'INSUFFICIENT_STOCK: component stock_reserved exceeds usable capacity');
END;

-- 2. Products (Catalog Master)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('party_kit', 'monthly_box', 'mystery_box', 'finished_good', 'booth_craft')),
  base_guest_count INTEGER NOT NULL DEFAULT 1,
  projects_per_guest INTEGER NOT NULL DEFAULT 3,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 3. Product Variants (Theme / Colorway / Focal Variations)
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  theme TEXT,
  palette TEXT,
  focal_description TEXT,
  hardware_finish TEXT,
  price_cents_override INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 4. Bill of Materials (BOM Lines per Product/Variant)
CREATE TABLE IF NOT EXISTS bill_of_materials (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id TEXT REFERENCES product_variants(id) ON DELETE CASCADE,
  component_id TEXT NOT NULL REFERENCES components(id),
  quantity_per_guest REAL NOT NULL DEFAULT 0,
  fixed_kit_quantity INTEGER NOT NULL DEFAULT 0,
  safety_spare_quantity INTEGER NOT NULL DEFAULT 0,
  is_substitutable INTEGER NOT NULL DEFAULT 0,
  substitute_component_id TEXT REFERENCES components(id),
  created_at INTEGER NOT NULL
);

-- 5. Curated Mystery Box Prepacked Sealed Units (MYS-01..03, INV-05)
CREATE TABLE IF NOT EXISTS mystery_sealed_units (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  variant_id TEXT REFERENCES product_variants(id),
  product_sku TEXT NOT NULL,
  lot_number TEXT NOT NULL,
  theme TEXT NOT NULL,
  palette TEXT NOT NULL,
  guaranteed_projects INTEGER NOT NULL DEFAULT 3,
  contents_snapshot TEXT NOT NULL, -- JSON snapshot of packed SKUs & quantities
  status TEXT NOT NULL CHECK (status IN ('assembled', 'reserved', 'sold', 'quarantined', 'damaged')) DEFAULT 'assembled',
  reserved_by_session_id TEXT,
  reserved_at INTEGER,
  reservation_expires_at INTEGER,
  sold_in_order_id TEXT REFERENCES orders(id),
  bin_location TEXT,
  packed_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 6. Reservations (Temporary Locks during Checkout Session)
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'committed', 'expired', 'cancelled')) DEFAULT 'active',
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 7. Reservation Items (Granular Component Quantities Locked)
CREATE TABLE IF NOT EXISTS reservation_items (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  component_id TEXT NOT NULL REFERENCES components(id),
  quantity_reserved INTEGER NOT NULL CHECK (quantity_reserved > 0),
  created_at INTEGER NOT NULL
);

-- Trigger to increment component reservation automatically when reservation_items are inserted
CREATE TRIGGER IF NOT EXISTS trg_reserve_component AFTER INSERT ON reservation_items
BEGIN
  UPDATE components
  SET stock_reserved = stock_reserved + NEW.quantity_reserved,
      updated_at = strftime('%s', 'now')
  WHERE id = NEW.component_id;
END;

-- Trigger to release component reservation automatically when reservation_items are deleted
CREATE TRIGGER IF NOT EXISTS trg_release_component AFTER DELETE ON reservation_items
BEGIN
  UPDATE components
  SET stock_reserved = stock_reserved - OLD.quantity_reserved,
      updated_at = strftime('%s', 'now')
  WHERE id = OLD.component_id;
END;

-- 8. Orders (Purchased / Invoiced Customer Orders)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'allocated', 'packing', 'shipped', 'cancelled', 'refunded')) DEFAULT 'pending',
  customer_email TEXT NOT NULL,
  shipping_address TEXT, -- JSON
  billing_address TEXT,  -- JSON
  subtotal_cents INTEGER NOT NULL,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  reservation_id TEXT REFERENCES reservations(id),
  paid_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 9. Order Items (Lines within an Order)
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  variant_id TEXT REFERENCES product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  guest_count INTEGER NOT NULL DEFAULT 1,
  customization TEXT, -- JSON (personalization names, palette selections, etc.)
  allocated_sealed_unit_id TEXT REFERENCES mystery_sealed_units(id),
  unit_price_cents INTEGER NOT NULL,
  total_price_cents INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- 10. Immutable Inventory Movement Ledger (INV-04, INV-08)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  component_id TEXT NOT NULL REFERENCES components(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'receipt', 'assembly_consume', 'assembly_produce', 'reservation_lock',
    'reservation_release', 'sale_consume', 'booth_sale', 'damage',
    'correction', 'return_restock'
  )),
  quantity_delta INTEGER NOT NULL,
  reference_id TEXT,
  reference_type TEXT CHECK (reference_type IN ('order', 'reservation', 'lot', 'booth_tally', 'adjustment', 'supplier_po')),
  actor_id TEXT NOT NULL,
  reason TEXT,
  created_at INTEGER NOT NULL
);

-- 11. Webhook Events (PAY-03, PAY-04 Idempotency & Replay Resistance)
CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('received', 'processed', 'failed')) DEFAULT 'received',
  created_at INTEGER NOT NULL,
  processed_at INTEGER
);

-- 12. Transactional Email Outbox Queue (BCF-14 / EMAIL-01..03)
CREATE TABLE IF NOT EXISTS transactional_email_outbox (
  id TEXT PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_version TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON
  idempotency_key TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'queued', 'sent', 'failed', 'dead_letter')) DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at INTEGER,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Indexes for performance & query optimization
CREATE INDEX IF NOT EXISTS idx_components_sku ON components(sku);
CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_bom_product ON bill_of_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_bom_variant ON bill_of_materials(variant_id);
CREATE INDEX IF NOT EXISTS idx_bom_component ON bill_of_materials(component_id);
CREATE INDEX IF NOT EXISTS idx_mystery_sku_status ON mystery_sealed_units(product_sku, status);
CREATE INDEX IF NOT EXISTS idx_mystery_session ON mystery_sealed_units(reserved_by_session_id);
CREATE INDEX IF NOT EXISTS idx_movements_comp_time ON inventory_movements(component_id, created_at);
CREATE INDEX IF NOT EXISTS idx_movements_ref ON inventory_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_email_status ON transactional_email_outbox(status);
