-- Test seed for local D1 database
INSERT OR REPLACE INTO components (id, sku, name, stock_on_hand, stock_reserved, safety_stock, updated_at)
VALUES 
  ('comp-pen', 'PEN-01', 'Beadable Pen Blank', 50, 0, 5, 1728212400000),
  ('comp-key', 'KEY-01', 'Backpack Keychain Clasp', 50, 0, 5, 1728212400000),
  ('comp-focal', 'FOC-01', 'Theme Silicone Focal', 100, 0, 10, 1728212400000),
  ('comp-accent', 'ACC-01', 'Accent Acrylic Beads', 500, 0, 50, 1728212400000);
