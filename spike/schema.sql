-- BeadsILY D1 Schema Prototype & Reservation Invariants Spike

CREATE TABLE IF NOT EXISTS components (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  stock_on_hand INTEGER NOT NULL DEFAULT 0,
  stock_reserved INTEGER NOT NULL DEFAULT 0,
  safety_stock INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  component_id TEXT NOT NULL REFERENCES components(id),
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('locked', 'committed', 'released')),
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processed', 'failed')),
  created_at INTEGER NOT NULL,
  processed_at INTEGER
);

-- Trigger: Guarantees that stock_reserved can NEVER exceed (stock_on_hand - safety_stock).
-- When an UPDATE attempts to reserve more than available, SQLite raises an ABORT exception,
-- which causes the entire D1 transaction/batch to fail and rollback cleanly!
CREATE TRIGGER IF NOT EXISTS trg_enforce_stock_reservation
BEFORE UPDATE OF stock_reserved ON components
FOR EACH ROW
WHEN (NEW.stock_reserved > OLD.stock_reserved) AND (NEW.stock_reserved > (NEW.stock_on_hand - NEW.safety_stock))
BEGIN
  SELECT RAISE(ABORT, 'INSUFFICIENT_STOCK: Stock reserved exceeds available inventory minus safety stock');
END;
