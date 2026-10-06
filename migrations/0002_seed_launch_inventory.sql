-- Migration 0002: Seed Launch Inventory, Products, and BOM Definitions
-- Derived from: INVENTORY-INTAKE.csv & LAUNCH-CATALOG-AND-BOM-SPECIFICATION.md
-- Author: Oscar (oscar-muwid2fm), Backend Data & Inventory Engineer

-- 1. Seed 42 Component SKUs
INSERT OR REPLACE INTO components (
  id, sku, name, category, sub_category, material, color, size_mm, hole_size_mm, alphabet_character,
  unit_of_measure, units_per_pack, cost_per_unit_cents, stock_on_hand, stock_reserved, safety_stock,
  bin_location, supplier, supplier_ref, compatibility_notes, created_at, updated_at
) VALUES
-- Pens
('comp-pen-slv', 'PEN-BLANK-SLV', 'Beadable Ballpoint Pen Blank - Silver Finish', 'pen', 'mandrel_rod', 'Zinc Alloy / Stainless Rod', 'Silver', 140, 2.5, NULL, 'piece', 1, 45, 250, 0, 30, 'BIN-PEN-01', 'CraftSupplyDirect', 'CSD-PEN-SLV-100', 'Fits beads with >=2.0mm hole. 2.5mm threaded mandrel rod.', 1791279000, 1791279000),
('comp-pen-rgd', 'PEN-BLANK-RGD', 'Beadable Ballpoint Pen Blank - Rose Gold Finish', 'pen', 'mandrel_rod', 'Zinc Alloy / Stainless Rod', 'Rose Gold', 140, 2.5, NULL, 'piece', 1, 48, 220, 0, 30, 'BIN-PEN-02', 'CraftSupplyDirect', 'CSD-PEN-RGD-100', 'Fits beads with >=2.0mm hole. 2.5mm threaded mandrel rod.', 1791279000, 1791279000),
('comp-pen-gld', 'PEN-BLANK-GLD', 'Beadable Ballpoint Pen Blank - Gold Finish', 'pen', 'mandrel_rod', 'Zinc Alloy / Stainless Rod', 'Yellow Gold', 140, 2.5, NULL, 'piece', 1, 48, 180, 0, 25, 'BIN-PEN-03', 'CraftSupplyDirect', 'CSD-PEN-GLD-100', 'Fits beads with >=2.0mm hole. 2.5mm threaded mandrel rod.', 1791279000, 1791279000),
('comp-pen-blk', 'PEN-BLANK-BLK', 'Beadable Ballpoint Pen Blank - Matte Black Finish', 'pen', 'mandrel_rod', 'Zinc Alloy / Stainless Rod', 'Matte Black', 140, 2.5, NULL, 'piece', 1, 46, 160, 0, 20, 'BIN-PEN-04', 'CraftSupplyDirect', 'CSD-PEN-BLK-100', 'Fits beads with >=2.0mm hole. 2.5mm threaded mandrel rod.', 1791279000, 1791279000),

-- Clasps & Keyrings
('comp-key-slv', 'KEY-CLASP-SLV', 'Swivel Lobster Clasp & Split Keyring - Silver', 'hardware', 'clasp_keyring', 'Iron Alloy / Nickel-free', 'Silver', 65, 3.0, NULL, 'piece', 1, 35, 350, 0, 45, 'BIN-HDW-01', 'HardwareDepotPro', 'HDP-KEY-SLV-50', '3.0mm eyelet ring; compatible with 1.0mm-1.5mm cord and chain.', 1791279000, 1791279000),
('comp-key-rgd', 'KEY-CLASP-RGD', 'Swivel Lobster Clasp & Split Keyring - Rose Gold', 'hardware', 'clasp_keyring', 'Iron Alloy / Nickel-free', 'Rose Gold', 65, 3.0, NULL, 'piece', 1, 38, 280, 0, 35, 'BIN-HDW-02', 'HardwareDepotPro', 'HDP-KEY-RGD-50', '3.0mm eyelet ring; compatible with 1.0mm-1.5mm cord and chain.', 1791279000, 1791279000),
('comp-key-gld', 'KEY-CLASP-GLD', 'Swivel Lobster Clasp & Split Keyring - Gold', 'hardware', 'clasp_keyring', 'Iron Alloy / Nickel-free', 'Gold', 65, 3.0, NULL, 'piece', 1, 38, 240, 0, 30, 'BIN-HDW-03', 'HardwareDepotPro', 'HDP-KEY-GLD-50', '3.0mm eyelet ring; compatible with 1.0mm-1.5mm cord and chain.', 1791279000, 1791279000),
('comp-key-blk', 'KEY-CLASP-BLK', 'Swivel Lobster Clasp & Split Keyring - Matte Black', 'hardware', 'clasp_keyring', 'Iron Alloy / Nickel-free', 'Matte Black', 65, 3.0, NULL, 'piece', 1, 37, 210, 0, 25, 'BIN-HDW-04', 'HardwareDepotPro', 'HDP-KEY-BLK-50', '3.0mm eyelet ring; compatible with 1.0mm-1.5mm cord and chain.', 1791279000, 1791279000),

-- Cordage
('comp-crd-elast', 'CRD-ELAST-1MM', 'Heavy-Duty Clear Elastic Stretch Cord (1.0mm)', 'cord', 'elastic_tpu', 'TPU Silicone Elastomer', 'Crystal Clear', 1.0, 0.0, NULL, 'piece', 1, 5, 1200, 0, 150, 'BIN-CRD-01', 'BeadalonBoutique', 'BBL-CRD-10-100M', 'Pre-cut 12-inch strands. Tested knot retention with surgeon knot.', 1791279000, 1791279000),

-- Focals
('comp-foc-heart', 'FOC-TAY-HEART', 'Silicone Focal Bead - Friendship Heart Sunglasses', 'focal', 'silicone_novelty', 'Food-Grade Silicone', 'Pastel Pink / White', 28, 2.5, NULL, 'piece', 1, 52, 180, 0, 25, 'BIN-FOC-01', 'SiliconeCraftsUSA', 'SCU-FOC-HEART-50', '2.5mm center hole fits pen rod and 1.0mm elastic cord.', 1791279000, 1791279000),
('comp-foc-disco', 'FOC-TAY-DISCO', 'Silicone Focal Bead - Sparkling Mirror Disco Ball', 'focal', 'silicone_novelty', 'Food-Grade Silicone', 'Silver Glitter / Grey', 24, 2.5, NULL, 'piece', 1, 55, 175, 0, 25, 'BIN-FOC-02', 'SiliconeCraftsUSA', 'SCU-FOC-DISCO-50', '2.5mm center hole fits pen rod and 1.0mm elastic cord.', 1791279000, 1791279000),
('comp-foc-sun', 'FOC-BOHO-SUN', 'Silicone Focal Bead - Desert Sunburst', 'focal', 'silicone_novelty', 'Food-Grade Silicone', 'Terracotta / Mustard', 26, 2.5, NULL, 'piece', 1, 50, 160, 0, 20, 'BIN-FOC-03', 'SiliconeCraftsUSA', 'SCU-FOC-SUN-50', '2.5mm center hole fits pen rod and 1.0mm elastic cord.', 1791279000, 1791279000),
('comp-foc-cact', 'FOC-BOHO-CACT', 'Silicone Focal Bead - Saguaro Blossom Cactus', 'focal', 'silicone_novelty', 'Food-Grade Silicone', 'Sage Green / Desert Rose', 30, 2.5, NULL, 'piece', 1, 52, 155, 0, 20, 'BIN-FOC-04', 'SiliconeCraftsUSA', 'SCU-FOC-CACT-50', '2.5mm center hole fits pen rod and 1.0mm elastic cord.', 1791279000, 1791279000),
('comp-foc-smile', 'FOC-NEON-SMILE', 'Silicone Focal Bead - Neon Retro Daisy Smiley', 'focal', 'silicone_novelty', 'Food-Grade Silicone', 'Neon Yellow / White', 26, 2.5, NULL, 'piece', 1, 48, 190, 0, 25, 'BIN-FOC-05', 'SiliconeCraftsUSA', 'SCU-FOC-SMILE-50', '2.5mm center hole fits pen rod and 1.0mm elastic cord.', 1791279000, 1791279000),
('comp-foc-star', 'FOC-NEON-STAR', 'Silicone Focal Bead - Neon Electric Starburst', 'focal', 'silicone_novelty', 'Food-Grade Silicone', 'Hot Pink / Electric Blue', 25, 2.5, NULL, 'piece', 1, 49, 170, 0, 25, 'BIN-FOC-06', 'SiliconeCraftsUSA', 'SCU-FOC-STAR-50', '2.5mm center hole fits pen rod and 1.0mm elastic cord.', 1791279000, 1791279000),
('comp-foc-crown', 'FOC-PRN-CROWN', 'Silicone Focal Bead - Fairytale Princess Tiara', 'focal', 'silicone_novelty', 'Food-Grade Silicone', 'Lilac / Gold Pearl', 28, 2.5, NULL, 'piece', 1, 54, 165, 0, 20, 'BIN-FOC-07', 'SiliconeCraftsUSA', 'SCU-FOC-CROWN-50', '2.5mm center hole fits pen rod and 1.0mm elastic cord.', 1791279000, 1791279000),
('comp-foc-buttr', 'FOC-PRN-BUTTR', 'Silicone Focal Bead - Monarch Fairy Butterfly', 'focal', 'silicone_novelty', 'Food-Grade Silicone', 'Soft Peach / Iridescent', 28, 2.5, NULL, 'piece', 1, 53, 160, 0, 20, 'BIN-FOC-08', 'SiliconeCraftsUSA', 'SCU-FOC-BUTTR-50', '2.5mm center hole fits pen rod and 1.0mm elastic cord.', 1791279000, 1791279000),
('comp-foc-pump', 'FOC-FALL-PUMP', 'Silicone Focal Bead - Santa Fe Autumn Pumpkin', 'focal', 'silicone_novelty', 'Food-Grade Silicone', 'Spiced Orange / Caramel', 25, 2.5, NULL, 'piece', 1, 48, 210, 0, 30, 'BIN-FOC-09', 'SiliconeCraftsUSA', 'SCU-FOC-PUMP-50', 'Booth & Fall special. Fits pen and cord.', 1791279000, 1791279000),
('comp-foc-leaf', 'FOC-FALL-LEAF', 'Silicone Focal Bead - Golden Maple Leaf', 'focal', 'silicone_novelty', 'Food-Grade Silicone', 'Burnt Amber / Gold', 26, 2.5, NULL, 'piece', 1, 48, 200, 0, 30, 'BIN-FOC-10', 'SiliconeCraftsUSA', 'SCU-FOC-LEAF-50', 'Booth & Fall special. Fits pen and cord.', 1791279000, 1791279000),

-- 15mm Round Silicone Beads
('comp-rnd-15-pk', 'RND-15MM-PSTLPK', 'Round Silicone Accent Bead 15mm - Pastel Pink', 'bead', 'silicone_round', 'Food-Grade Silicone', 'Pastel Pink', 15, 2.5, NULL, 'piece', 1, 14, 950, 0, 100, 'BIN-BEAD-01', 'SiliconeCraftsUSA', 'SCU-RND-15-PK-100', 'Standard 15mm spacer. Fits pen rod and elastic cord.', 1791279000, 1791279000),
('comp-rnd-15-mt', 'RND-15MM-MINT', 'Round Silicone Accent Bead 15mm - Fresh Mint', 'bead', 'silicone_round', 'Food-Grade Silicone', 'Fresh Mint', 15, 2.5, NULL, 'piece', 1, 14, 900, 0, 100, 'BIN-BEAD-02', 'SiliconeCraftsUSA', 'SCU-RND-15-MT-100', 'Standard 15mm spacer. Fits pen rod and elastic cord.', 1791279000, 1791279000),
('comp-rnd-15-lc', 'RND-15MM-LILAC', 'Round Silicone Accent Bead 15mm - Soft Lilac', 'bead', 'silicone_round', 'Food-Grade Silicone', 'Soft Lilac', 15, 2.5, NULL, 'piece', 1, 14, 880, 0, 100, 'BIN-BEAD-03', 'SiliconeCraftsUSA', 'SCU-RND-15-LC-100', 'Standard 15mm spacer. Fits pen rod and elastic cord.', 1791279000, 1791279000),
('comp-rnd-15-sg', 'RND-15MM-SAGE', 'Round Silicone Accent Bead 15mm - Desert Sage', 'bead', 'silicone_round', 'Food-Grade Silicone', 'Desert Sage', 15, 2.5, NULL, 'piece', 1, 14, 820, 0, 90, 'BIN-BEAD-04', 'SiliconeCraftsUSA', 'SCU-RND-15-SG-100', 'Standard 15mm spacer. Fits pen rod and elastic cord.', 1791279000, 1791279000),
('comp-rnd-15-tc', 'RND-15MM-TERRA', 'Round Silicone Accent Bead 15mm - Terracotta Clay', 'bead', 'silicone_round', 'Food-Grade Silicone', 'Terracotta', 15, 2.5, NULL, 'piece', 1, 14, 800, 0, 90, 'BIN-BEAD-05', 'SiliconeCraftsUSA', 'SCU-RND-15-TC-100', 'Standard 15mm spacer. Fits pen rod and elastic cord.', 1791279000, 1791279000),
('comp-rnd-15-ey', 'RND-15MM-NEONYL', 'Round Silicone Accent Bead 15mm - Electric Yellow', 'bead', 'silicone_round', 'Food-Grade Silicone', 'Electric Yellow', 15, 2.5, NULL, 'piece', 1, 14, 750, 0, 80, 'BIN-BEAD-06', 'SiliconeCraftsUSA', 'SCU-RND-15-EY-100', 'Standard 15mm spacer. Fits pen rod and elastic cord.', 1791279000, 1791279000),
('comp-rnd-15-hp', 'RND-15MM-HOTPK', 'Round Silicone Accent Bead 15mm - Neon Hot Pink', 'bead', 'silicone_round', 'Food-Grade Silicone', 'Neon Hot Pink', 15, 2.5, NULL, 'piece', 1, 14, 780, 0, 80, 'BIN-BEAD-07', 'SiliconeCraftsUSA', 'SCU-RND-15-HP-100', 'Standard 15mm spacer. Fits pen rod and elastic cord.', 1791279000, 1791279000),
('comp-rnd-15-am', 'RND-15MM-AMBER', 'Round Silicone Accent Bead 15mm - Autumn Amber', 'bead', 'silicone_round', 'Food-Grade Silicone', 'Autumn Amber', 15, 2.5, NULL, 'piece', 1, 14, 850, 0, 90, 'BIN-BEAD-08', 'SiliconeCraftsUSA', 'SCU-RND-15-AM-100', 'Standard 15mm spacer. Fits pen rod and elastic cord.', 1791279000, 1791279000),

-- 12mm Round Silicone Beads
('comp-rnd-12-wh', 'RND-12MM-WHT', 'Round Silicone Bead 12mm - Pure White', 'bead', 'silicone_round', 'Food-Grade Silicone', 'Pure White', 12, 2.5, NULL, 'piece', 1, 10, 1400, 0, 150, 'BIN-BEAD-09', 'SiliconeCraftsUSA', 'SCU-RND-12-WH-100', 'Universal spacer bead for pens and bracelets.', 1791279000, 1791279000),
('comp-rnd-12-gs', 'RND-12MM-GLTRSLV', 'Round Silicone Bead 12mm - Silver Glitter Sparkle', 'bead', 'silicone_round', 'Food-Grade Silicone / Glitter', 'Silver Glitter', 12, 2.5, NULL, 'piece', 1, 12, 950, 0, 100, 'BIN-BEAD-10', 'SiliconeCraftsUSA', 'SCU-RND-12-GS-100', 'Universal spacer bead with fine glitter infusion.', 1791279000, 1791279000),
('comp-rnd-12-gg', 'RND-12MM-GLTRGLD', 'Round Silicone Bead 12mm - Gold Glitter Sparkle', 'bead', 'silicone_round', 'Food-Grade Silicone / Glitter', 'Gold Glitter', 12, 2.5, NULL, 'piece', 1, 12, 890, 0, 100, 'BIN-BEAD-11', 'SiliconeCraftsUSA', 'SCU-RND-12-GG-100', 'Universal spacer bead with fine glitter infusion.', 1791279000, 1791279000),

-- Rhinestone Rondelles
('comp-spc-8-slv', 'SPC-RON-8MM-SLV', 'Rhinestone Rondelle Spacer Bead 8mm - Silver', 'bead', 'metal_rhinestone', 'Zinc Alloy / Crystal Rhinestone', 'Silver / Clear Crystal', 8, 2.2, NULL, 'piece', 1, 6, 1600, 0, 180, 'BIN-BEAD-12', 'GlamBeadWholesale', 'GBW-RON-08-SLV', 'Adds luxury sparkle between 12mm/15mm silicone beads.', 1791279000, 1791279000),
('comp-spc-8-gld', 'SPC-RON-8MM-GLD', 'Rhinestone Rondelle Spacer Bead 8mm - Gold', 'bead', 'metal_rhinestone', 'Zinc Alloy / Crystal Rhinestone', 'Gold / Clear Crystal', 8, 2.2, NULL, 'piece', 1, 6, 1450, 0, 160, 'BIN-BEAD-13', 'GlamBeadWholesale', 'GBW-RON-08-GLD', 'Adds luxury sparkle between 12mm/15mm silicone beads.', 1791279000, 1791279000),

-- Alphabet Cube Beads
('comp-alph-wb', 'ALPH-SIL-WHT-BLK', 'Cube Silicone Alphabet Bead 12mm - White with Black Letter', 'bead', 'silicone_alphabet', 'Food-Grade Silicone', 'White / Black', 12, 2.5, 'POOLED', 'piece', 1, 8, 2400, 0, 250, 'BIN-ALPH-01', 'AlphabetSiliconeCo', 'ASC-CUB-12-WB', 'Pooled assortment (A-Z). Fits 2.5mm mandrel and cord.', 1791279000, 1791279000),
('comp-alph-pw', 'ALPH-SIL-PST-WHT', 'Cube Silicone Alphabet Bead 12mm - Pastel Multi with White Letter', 'bead', 'silicone_alphabet', 'Food-Grade Silicone', 'Pastel Mix / White', 12, 2.5, 'POOLED', 'piece', 1, 8, 2100, 0, 220, 'BIN-ALPH-02', 'AlphabetSiliconeCo', 'ASC-CUB-12-PW', 'Pooled assortment (A-Z). Fits 2.5mm mandrel and cord.', 1791279000, 1791279000),

-- Host Shared Tools
('comp-tool-scis', 'TOOL-SCIS-BLUNT', 'Kid-Safe Stainless Precision Craft Scissors (Blunt 5-inch)', 'tool', 'shears', 'Stainless Steel / ABS Plastic', 'Mint Green / White', 127, 0.0, NULL, 'piece', 1, 120, 95, 0, 10, 'BIN-TOOL-01', 'SchoolCraftDirect', 'SCD-SCI-5B-MNT', 'Host kit shared equipment. Rounded tip prevents accidents.', 1791279000, 1791279000),
('comp-tool-tray', 'TOOL-TRAY-6COMP', 'Silicone Bead Sorting & Design Tray (6-Compartment)', 'tool', 'organizer', 'Food-Grade Silicone', 'Dusty Rose', 180, 0.0, NULL, 'piece', 1, 140, 110, 0, 12, 'BIN-TOOL-02', 'SiliconeCraftsUSA', 'SCU-TRY-FLW-ROSE', 'Host kit shared equipment. Non-slip, stops bead rolls.', 1791279000, 1791279000),
('comp-tool-tape', 'TOOL-TAPE-MEAS', 'Retractable Soft Tailor Tape Measure (60-inch / 150cm)', 'tool', 'measuring', 'Fiberglass / ABS Plastic', 'Pastel Mint', 50, 0.0, NULL, 'piece', 1, 45, 60, 0, 8, 'BIN-TOOL-03', 'SchoolCraftDirect', 'SCD-TAP-60-MNT', 'Host kit shared equipment. For sizing wrists.', 1791279000, 1791279000),

-- Packaging & Literature
('comp-pkg-org', 'PKG-BAG-ORG-4X6', 'Shimmer Organza Gift Pouch (4x6 inch / 10x15cm)', 'packaging', 'pouch', 'Sheer Organza / Satin Ribbon', 'White Shimmer', 150, 0.0, NULL, 'piece', 1, 10, 1500, 0, 180, 'BIN-PKG-01', 'PackagingWorldDirect', 'PWD-ORG-4X6-WHT', 'Individual guest gift packaging (1 per guest).', 1791279000, 1791279000),
('comp-pkg-box-kft', 'PKG-BOX-KRAFT-12X9', 'Luxury Kraft Party Kit Presentation Box with Sleeve', 'packaging', 'carton', 'E-Flute Corrugated / Kraft', 'Natural Kraft / Mint', 305, 0.0, NULL, 'piece', 1, 210, 140, 0, 20, 'BIN-PKG-02', 'CustomBoxMakers', 'CBM-KFT-12X9X4', 'Master box holding all 15-guest party kit materials.', 1791279000, 1791279000),
('comp-pkg-box-mlr', 'PKG-BOX-MAILER-7X5', 'Mystery Craft Box Rigid Mailer (7x5x2 inch)', 'packaging', 'carton', 'E-Flute Corrugated / White', 'White / Purple Branding', 178, 0.0, NULL, 'piece', 1, 85, 260, 0, 30, 'BIN-PKG-03', 'CustomBoxMakers', 'CBM-WHT-7X5X2', 'Sealed unit box for Mystery Maker & Bestie Duo.', 1791279000, 1791279000),
('comp-pkg-card-set', 'PKG-CARD-INSTR-SET', 'Full-Color Laminated Guest Step-by-Step Instruction Cards', 'packaging', 'print', '350gsm Silk Cardstock / Matte Lam', 'Full Color', 150, 0.0, NULL, 'pack', 1, 120, 120, 0, 15, 'BIN-PKG-04', 'PrintProLocal', 'PPL-CRD-15PK-CLR', '15 cards per pack (1 per guest) with diagrams.', 1791279000, 1791279000),
('comp-pkg-guide-host', 'PKG-GUIDE-HOST-MSTR', 'Host Master Planner Guide & Party Activity Checklist', 'packaging', 'print', '80lb Gloss Book / Staple Bound', 'Full Color', 216, 0.0, NULL, 'piece', 1, 60, 130, 0, 15, 'BIN-PKG-05', 'PrintProLocal', 'PPL-BKT-HOST-MSTR', '1 host booklet per kit with knot-tying and time tips.', 1791279000, 1791279000);

-- 2. Seed 7 Launch Products
INSERT OR REPLACE INTO products (id, sku, title, slug, product_type, base_guest_count, projects_per_guest, price_cents, currency, is_active, created_at, updated_at) VALUES
('prod-pk-tay', 'PK-15-TAY', 'Taylor''s Era Friendship Bead Bar Party Kit', 'taylors-era-friendship-party-kit', 'party_kit', 15, 3, 18900, 'USD', 1, 1791279000, 1791279000),
('prod-pk-boho', 'PK-15-BOHO', 'Desert Bloom & Boho Party Kit', 'desert-bloom-boho-party-kit', 'party_kit', 15, 3, 18900, 'USD', 1, 1791279000, 1791279000),
('prod-pk-neon', 'PK-15-NEON', 'Glow & Neon Retro Daisy Party Kit', 'glow-neon-retro-daisy-party-kit', 'party_kit', 15, 3, 18900, 'USD', 1, 1791279000, 1791279000),
('prod-pk-prn', 'PK-15-PRN', 'Pastel Princess & Fairytale Party Kit', 'pastel-princess-fairytale-party-kit', 'party_kit', 15, 3, 18900, 'USD', 1, 1791279000, 1791279000),
('prod-mys-mkr', 'MYS-MKR-01', 'Mystery Maker Solo Craft Box', 'mystery-maker-craft-box', 'mystery_box', 1, 3, 1999, 'USD', 1, 1791279000, 1791279000),
('prod-mys-duo', 'MYS-DUO-01', 'Bestie Mystery Duo Craft Box', 'bestie-mystery-duo-box', 'mystery_box', 2, 6, 3499, 'USD', 1, 1791279000, 1791279000),
('prod-bth-sfe', 'BTH-SFE-01', 'Santa Fe Elementary Fall Festival Mini-Kit', 'santa-fe-elementary-booth-kit', 'booth_craft', 1, 1, 600, 'USD', 1, 1791279000, 1791279000);

-- 3. Seed Product Variants
INSERT OR REPLACE INTO product_variants (id, product_id, sku, title, theme, palette, focal_description, hardware_finish, price_cents_override, is_active, created_at, updated_at) VALUES
('var-pk-tay-std', 'prod-pk-tay', 'VAR-PK-TAY-STD', 'Taylor''s Era Friendship Kit (Standard Silver)', 'Friendship & Music', 'Pastel Pink, Soft Lilac, Silver Glitter', 'Heart Sunglasses & Disco Balls', 'Silver', NULL, 1, 1791279000, 1791279000),
('var-pk-boho-std', 'prod-pk-boho', 'VAR-PK-BOHO-STD', 'Desert Bloom Boho Kit (Rose Gold)', 'Southwestern Desert Bloom', 'Terracotta, Desert Sage, White', 'Desert Sunburst & Saguaro Cactus', 'Rose Gold', NULL, 1, 1791279000, 1791279000),
('var-pk-neon-std', 'prod-pk-neon', 'VAR-PK-NEON-STD', 'Glow Neon Daisy Kit (Standard Silver)', 'Retro Y2K Glow', 'Electric Yellow, Hot Pink, Pure White', 'Daisy Smiley & Neon Starburst', 'Silver', NULL, 1, 1791279000, 1791279000),
('var-pk-prn-std', 'prod-pk-prn', 'VAR-PK-PRN-STD', 'Pastel Princess Kit (Yellow Gold)', 'Fairytale Fantasy', 'Soft Lilac, Pastel Pink, Gold Glitter', 'Princess Tiara & Fairy Butterfly', 'Yellow Gold', NULL, 1, 1791279000, 1791279000),
('var-mys-mkr-std', 'prod-mys-mkr', 'VAR-MYS-MKR-STD', 'Mystery Maker Solo (Curated Surprise)', 'Surprise Assortment', 'Surprise Palette', '3 Surprise Silicone Focals', 'Surprise Finish', NULL, 1, 1791279000, 1791279000),
('var-mys-duo-std', 'prod-mys-duo', 'VAR-MYS-DUO-STD', 'Bestie Mystery Duo (Curated Complementary)', 'Surprise Bestie Duo', 'Complementary Surprise Palettes', '6 Surprise Silicone Focals', 'Surprise Finish', NULL, 1, 1791279000, 1791279000),
('var-bth-sfe-std', 'prod-bth-sfe', 'VAR-BTH-SFE-STD', 'Santa Fe Fall Festival Booth Charm/Pen', 'Autumn Harvest', 'Autumn Amber & Terracotta', 'Fall Pumpkin or Maple Leaf', 'Silver / Black', NULL, 1, 1791279000, 1791279000);

-- 4. Seed Bill of Materials (BOM) for Taylor's Era Party Kit (PK-15-TAY)
-- Guarantees 45 finished projects for 15 guests (3 per guest: pen, backpack keychain, stretch bracelet)
INSERT OR REPLACE INTO bill_of_materials (id, product_id, variant_id, component_id, quantity_per_guest, fixed_kit_quantity, safety_spare_quantity, is_substitutable, substitute_component_id, created_at) VALUES
('bom-tay-pen', 'prod-pk-tay', 'var-pk-tay-std', 'comp-pen-slv', 1.0, 0, 1, 1, 'comp-pen-rgd', 1791279000),
('bom-tay-key', 'prod-pk-tay', 'var-pk-tay-std', 'comp-key-slv', 1.0, 0, 1, 1, 'comp-key-rgd', 1791279000),
('bom-tay-crd', 'prod-pk-tay', 'var-pk-tay-std', 'comp-crd-elast', 1.0, 0, 3, 0, NULL, 1791279000),
('bom-tay-foc1', 'prod-pk-tay', 'var-pk-tay-std', 'comp-foc-heart', 1.5, 0, 2, 0, NULL, 1791279000),
('bom-tay-foc2', 'prod-pk-tay', 'var-pk-tay-std', 'comp-foc-disco', 1.5, 0, 1, 0, NULL, 1791279000),
('bom-tay-rnd1', 'prod-pk-tay', 'var-pk-tay-std', 'comp-rnd-15-pk', 5.33, 0, 10, 0, NULL, 1791279000),
('bom-tay-rnd2', 'prod-pk-tay', 'var-pk-tay-std', 'comp-rnd-15-lc', 5.33, 0, 10, 0, NULL, 1791279000),
('bom-tay-rnd3', 'prod-pk-tay', 'var-pk-tay-std', 'comp-rnd-12-gs', 6.67, 0, 10, 0, NULL, 1791279000),
('bom-tay-spc', 'prod-pk-tay', 'var-pk-tay-std', 'comp-spc-8-slv', 2.0, 0, 5, 0, NULL, 1791279000),
('bom-tay-alph', 'prod-pk-tay', 'var-pk-tay-std', 'comp-alph-wb', 0.0, 60, 0, 1, 'comp-alph-pw', 1791279000),
('bom-tay-pouch', 'prod-pk-tay', 'var-pk-tay-std', 'comp-pkg-org', 1.0, 0, 1, 0, NULL, 1791279000),
('bom-tay-scis', 'prod-pk-tay', 'var-pk-tay-std', 'comp-tool-scis', 0.0, 2, 0, 0, NULL, 1791279000),
('bom-tay-tray', 'prod-pk-tay', 'var-pk-tay-std', 'comp-tool-tray', 0.0, 2, 0, 0, NULL, 1791279000),
('bom-tay-tape', 'prod-pk-tay', 'var-pk-tay-std', 'comp-tool-tape', 0.0, 1, 0, 0, NULL, 1791279000),
('bom-tay-guide', 'prod-pk-tay', 'var-pk-tay-std', 'comp-pkg-guide-host', 0.0, 1, 0, 0, NULL, 1791279000),
('bom-tay-cards', 'prod-pk-tay', 'var-pk-tay-std', 'comp-pkg-card-set', 0.0, 1, 0, 0, NULL, 1791279000),
('bom-tay-box', 'prod-pk-tay', 'var-pk-tay-std', 'comp-pkg-box-kft', 0.0, 1, 0, 0, NULL, 1791279000);

-- 5. Record Initial Intake Receipts in Immutable Movement Ledger
INSERT OR IGNORE INTO inventory_movements (id, component_id, movement_type, quantity_delta, reference_id, reference_type, actor_id, reason, created_at)
SELECT 
  'rcpt-' || sku,
  id,
  'receipt',
  stock_on_hand,
  'PO-2026-INITIAL-INTAKE',
  'supplier_po',
  'pam-muwic8fg',
  'Physical inventory count intake verified by Pam Beesley',
  1791279000
FROM components;
