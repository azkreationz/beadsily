# BeadsILY Launch Catalog Scope & Bill of Materials (BOM) Specification

**Document Version:** 1.0.0  
**Phase:** Phase 0 Discovery & Foundation (`BCF-3`)  
**Lead:** Pam (`pam-muwic8fg`), Product Operations Lead  
**Designated Reviewer:** Oscar (`oscar-muwid2fm`), Backend Inventory Engineer  
**Independent QA Reviewer:** Toby (`toby-muwie8nd`), Compliance & QA Certifier  
**Target Event:** Santa Fe Elementary Fall Festival (Friday, October 23, 2026, 5–8 p.m. America/Phoenix)  
**Governing Mission:** [`MISSION-BEADSILY-COMMERCE.md`](file:///C:/repositories/beadsily-com-floor/missions/MISSION-BEADSILY-COMMERCE.md)  
**Companion Data:** [`INVENTORY-INTAKE.csv`](file:///C:/repositories/beadsily-com-floor/worktrees/pam-muwic8fg/docs/inventory/INVENTORY-INTAKE.csv)  
**Acceptance Criteria Impact:** `CAT-01`, `CAT-02`, `CAT-03`, `INV-01`, `INV-02`, `INV-03`, `INV-04`, `INV-05`, `MYS-01`, `MYS-02`, `MYS-03`, `KIT-01`, `EVENT-01`

---

## 1. Executive Summary & Operational Principles

BeadsILY delivers premium, thoughtfully curated bead experiences starting at 15 party guests, curated one-time mystery craft boxes, and school booth finished crafts. To eliminate stock discrepancies and customer dissatisfaction:

1. **Strict Physical Accounting (No Photo Guessing):** Inventory numbers reflect human physical counts and supplier invoices. Photographs illustrate variety and style, never saleable stock.
2. **Ironclad Project Guarantee (CAT-01):** Every standard 15-guest party kit guarantees **45 complete finished projects** (3 per guest: 1 beadable pen, 1 backpack keychain charm, 1 stretch bracelet).
3. **Single Authoritative Component Ledger (INV-04):** Party kits, mystery boxes, and school festival booth inventory draw from a unified Cloudflare D1 inventory pool.
4. **Prepacked Sealed Units for Mystery Boxes (MYS-01..03, INV-05):** Mystery boxes are physically assembled into sealed units before sale. Assembly consumes raw components; purchase consumes the sealed box. No runtime roulette wheel, no virtual ticket gambling, and zero phantom variant pooling.
5. **No Self-Approval of Pricing:** All retail prices herein are grounded cost accounting models submitted for Korry Nelson's review and sign-off.

---

## 2. Launch Catalog Scope: 7 Validated Products

Rather than launching with 30 speculative themes, BeadsILY establishes launch operations on **7 verified products** supported by physically verified components in stock:

| Product Code | Title & Category | Target Audience / Occasion | Base Guests | Finished Projects | Surprise / Customization Dimension | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **PK-15-TAY** | **Taylor's Era Friendship Bead Bar Party Kit** *(Party Kit)* | Tweens, Teens, Adult Friendship Parties, Concert Nights | 15 | **45** | Custom alphabet sayings, pastel & glitter disco palette | Launch Ready |
| **PK-15-BOHO** | **Desert Bloom & Boho Party Kit** *(Party Kit)* | Birthdays, Showers, Southwestern Celebrations | 15 | **45** | Saguaro blossoms, rising suns, terracotta & sage tones | Launch Ready |
| **PK-15-NEON** | **Glow & Neon Retro Daisy Party Kit** *(Party Kit)* | Roller Skating, 90s/Y2K, Glow Parties, Active Tweens | 15 | **45** | Daisy smileys, electric starbursts, neon vibrant tones | Launch Ready |
| **PK-15-PRN** | **Pastel Princess & Fairytale Party Kit** *(Party Kit)* | Children's Birthdays (Ages 6+), Fairytale / Tea Parties | 15 | **45** | Tiara crowns, fairy butterflies, soft lilac & gold accents | Launch Ready |
| **MYS-MKR-01** | **Mystery Maker Solo Craft Box** *(Curated Mystery)* | Individual Crafters, Tweens, Gift Recipient | 1 | **3** | Surprise palette & focal designs; 100% complete supplies | Launch Ready |
| **MYS-DUO-01** | **Bestie Mystery Duo Craft Box** *(Curated Mystery)* | Two Best Friends, Sibling Craft Afternoon | 2 | **6** | Complementary surprise themes (2 sets of 3 projects) | Launch Ready |
| **BTH-SFE-01** | **Santa Fe Elementary Fall Festival Mini-Kit** *(Booth/Event)* | School Festival Attendees, Quick On-Site Crafters | 1 | **1** | Autumn pumpkin / maple leaf charm or beadable pen | Oct 23 Event |

---

## 3. 15-Guest Party Kit Bill of Materials (BOM) & Recipes

### 3.1 Project Definition per Guest (45 Projects Total)

Each guest receives materials to assemble **3 distinct, high-utility craft projects**:
- **Project 1: Custom Beadable Ballpoint Pen** (1 metal blank with 2.5mm rod, 1 theme focal bead, 3–4 round silicone/spacer beads).
- **Project 2: Swivel Lobster Backpack Keychain Charm** (1 heavy-duty clasp/ring, 1 theme focal bead, 4–5 silicone beads & spacers, knotted cord).
- **Project 3: Premium Stretch Bead Bracelet** (12-inch 1.0mm heavy-duty TPU elastic, 1 theme focal bead, 10–12 silicone beads, optional personalized alphabet name).

### 3.2 Master BOM Table for 15-Guest Base Party Kit

| Category | Component Description | Allocation Rule | Base Qty (15 Guests) | Buffer / Spares | Total Kit Allocation | SKU Reference |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Hardware** | Beadable Ballpoint Pen Blank | 1 per guest | 15 | +1 spare | **16 pens** | `PEN-BLANK-SLV` / `RGD` |
| **Hardware** | Swivel Lobster Clasp & Keyring | 1 per guest | 15 | +1 spare | **16 clasps** | `KEY-CLASP-SLV` / `RGD` |
| **Cordage** | Heavy-Duty 1.0mm Clear Stretch Cord | 12" per guest | 15 strands | +3 strands | **18 strands (18 ft)** | `CRD-ELAST-1MM` |
| **Focals** | Theme Food-Grade Silicone Focals | 3 per guest (1/project) | 45 | +3 spares | **48 focals** | `FOC-*` (theme-specific) |
| **Accent Beads** | 15mm Round Silicone Accent Beads | 10 per guest | 150 | +15 spares | **165 beads** | `RND-15MM-*` |
| **Accent Beads** | 12mm Round Silicone Accent Beads | 6 per guest | 90 | +10 spares | **100 beads** | `RND-12MM-*` |
| **Spacers** | 8mm Crystal Rhinestone Rondelles | 2 per guest | 30 | +5 spares | **35 rondelles**| `SPC-RON-8MM-*` |
| **Alphabet** | 12mm Cube Silicone Alphabet Beads | Optional name/words | 60 pooled | N/A | **60 letters** | `ALPH-SIL-*` |
| **Packaging** | Shimmer Organza Gift Pouch (4x6") | 1 per guest | 15 | +1 spare | **16 pouches** | `PKG-BAG-ORG-4X6` |
| **Host Tools** | Kid-Safe Blunt Craft Scissors (5") | Fixed shared | 2 | 0 | **2 pairs** | `TOOL-SCIS-BLUNT` |
| **Host Tools** | Silicone 6-Well Sorting Flower Trays| Fixed shared | 2 | 0 | **2 trays** | `TOOL-TRAY-6COMP` |
| **Host Tools** | Retractable Soft Tailor Tape Measure| Fixed shared | 1 | 0 | **1 tape** | `TOOL-TAPE-MEAS` |
| **Literature** | Host Master Planner Guide (12-page)| Fixed shared | 1 | 0 | **1 guide** | `PKG-GUIDE-HOST-MSTR` |
| **Literature** | Laminated Guest Step-by-Step Cards | 1 per guest | 15 | 0 | **15 cards (1 pk)** | `PKG-CARD-INSTR-SET` |
| **Master Box** | Luxury Kraft Presentation Box & Sleeve| Master packaging | 1 | 0 | **1 box** | `PKG-BOX-KRAFT-12X9` |

### 3.3 Theme Recipe Variations

1. **Taylor's Era Friendship Kit (`PK-15-TAY`):**
   - Focals: 24 `FOC-TAY-HEART` (Heart Sunglasses) + 24 `FOC-TAY-DISCO` (Glitter Disco Spheres).
   - Accents: 85 `RND-15MM-PSTLPK`, 80 `RND-15MM-LILAC`, 100 `RND-12MM-GLTRSLV`.
   - Spacers: 35 `SPC-RON-8MM-SLV`.
   - Hardware: Silver finishes (`PEN-BLANK-SLV`, `KEY-CLASP-SLV`).
   - Alphabet: `ALPH-SIL-WHT-BLK` (classic friendship bracelet style).

2. **Desert Bloom & Boho Kit (`PK-15-BOHO`):**
   - Focals: 24 `FOC-BOHO-SUN` (Sunburst) + 24 `FOC-BOHO-CACT` (Saguaro Blossom).
   - Accents: 85 `RND-15MM-TERRA`, 80 `RND-15MM-SAGE`, 100 `RND-12MM-WHT`.
   - Spacers: 35 `SPC-RON-8MM-GLD`.
   - Hardware: Rose Gold finishes (`PEN-BLANK-RGD`, `KEY-CLASP-RGD`).
   - Alphabet: `ALPH-SIL-PST-WHT`.

3. **Glow & Neon Retro Daisy Kit (`PK-15-NEON`):**
   - Focals: 24 `FOC-NEON-SMILE` (Daisy Smiley) + 24 `FOC-NEON-STAR` (Electric Star).
   - Accents: 85 `RND-15MM-NEONYL`, 80 `RND-15MM-HOTPK`, 100 `RND-12MM-WHT`.
   - Spacers: 35 `SPC-RON-8MM-SLV`.
   - Hardware: Silver finishes (`PEN-BLANK-SLV`, `KEY-CLASP-SLV`).
   - Alphabet: `ALPH-SIL-PST-WHT`.

4. **Pastel Princess & Fairytale Kit (`PK-15-PRN`):**
   - Focals: 24 `FOC-PRN-CROWN` (Princess Tiara) + 24 `FOC-PRN-BUTTR` (Fairy Butterfly).
   - Accents: 85 `RND-15MM-LILAC`, 80 `RND-15MM-PSTLPK`, 100 `RND-12MM-GLTRGLD`.
   - Spacers: 35 `SPC-RON-8MM-GLD`.
   - Hardware: Gold finishes (`PEN-BLANK-GLD`, `KEY-CLASP-GLD`).
   - Alphabet: `ALPH-SIL-PST-WHT`.

### 3.4 Dynamic Scaling Formula for Additional Guests ($N > 15$)

The BeadsILY party configurator supports guest counts up to 30. The server calculates requirements dynamically using:
$$\text{Total Quantity}(C) = \text{FixedQuantity}(C) + \lceil \text{GuestCount} \times \text{PerGuestRate}(C) \rceil + \text{SafetyBuffer}(C)$$

For every additional guest ($+1$ guest beyond 15):
- $+1$ Pen Blank
- $+1$ Swivel Lobster Clasp & Keyring
- $+1$ Pre-cut Elastic Cord (12")
- $+3$ Theme Silicone Focal Beads
- $+11$ 15mm Round Silicone Beads
- $+7$ 12mm Round Silicone Beads
- $+2$ 8mm Rhinestone Rondelles
- $+4$ Pooled Alphabet Letters
- $+1$ Organza Keepsake Bag
- $+1$ Laminated Step-by-Step Card
- **Shared host tools remain fixed** (no extra scissors or trays needed until 25+ guests).

---

## 4. Curated Mystery Box Specifications (MYS-01..03)

### 4.1 Physical Commerce Invariants

1. **Guaranteed Project Count:**
   - **Mystery Maker (`MYS-MKR-01`):** Guaranteed **3 projects** (1 pen, 1 backpack keychain charm, 1 stretch bracelet).
   - **Bestie Mystery Duo (`MYS-DUO-01`):** Guaranteed **6 projects** (2 pens, 2 keychains, 2 bracelets).
2. **Surprise Attribute:** Color palette, focal character designs, and accent harmonies remain undisclosed until unboxing.
3. **Prepacked Sealed Unit Lifecycle:**
   - Assembly staff build sealed boxes in batches (e.g., 25 units of `MYS-MKR-01`).
   - D1 executes atomic transaction:
     - Deduct raw components (`assembly_consume`).
     - Credit sealed box SKU stock (`assembly_produce`).
   - Customer checkout reserves and locks the prepacked sealed box unit.
   - Webhook retries never re-randomize or re-allocate units (`MYS-03`).

### 4.2 Mystery Maker BOM (`MYS-MKR-01`)
- 1 Beadable Pen Blank (`PEN-BLANK-*`)
- 1 Swivel Keyring Clasp (`KEY-CLASP-*`)
- 1 Pre-cut 12" Elastic Cord (`CRD-ELAST-1MM`)
- 3 Coordinated Surprise Silicone Focals (`FOC-*`)
- 12 Round 15mm Silicone Accents (`RND-15MM-*`)
- 8 Round 12mm Silicone Accents (`RND-12MM-*`)
- 3 Rhinestone Rondelles (`SPC-RON-8MM-*`)
- 1 Organza Bag (`PKG-BAG-ORG-4X6`)
- 1 Compact 3-Project Instruction Card (`PKG-CARD-INSTR-SET`)
- 1 Rigid Mystery Mailer Box (`PKG-BOX-MAILER-7X5`)

### 4.3 Bestie Mystery Duo BOM (`MYS-DUO-01`)
- 2 Beadable Pen Blanks
- 2 Swivel Keyring Clasps
- 2 Pre-cut 12" Elastic Cords
- 6 Coordinated Surprise Silicone Focals (3 matching/complementary pairs)
- 24 Round 15mm Silicone Accents
- 16 Round 12mm Silicone Accents
- 6 Rhinestone Rondelles
- 2 Organza Bags
- 2 Compact 3-Project Instruction Cards
- 1 Rigid Mystery Mailer Box (`PKG-BOX-MAILER-7X5`)

---

## 5. Physical Compatibility & Quality Invariants

To avoid failed assembly during customer parties (preventing `KIT-01` failures):

| Physical Interface | Specification | Tolerance / Rule | Failure Risk & Prevention |
| :--- | :--- | :--- | :--- |
| **Pen Mandrel Rod** | Diameter: 2.5mm | Beads must have $\ge 2.2\text{mm}$ hole | Silicone beads stretch over 2.5mm rod. Hard acrylic beads must have $\ge 2.5\text{mm}$ hole. |
| **Elastic Stretch Cord** | Diameter: 1.0mm TPU | Bead holes $\ge 1.2\text{mm}$ | 1.0mm provides optimal tensile strength for kids/tweens without snapping. Double surgeon's knot required. |
| **Lobster Clasp Eyelet** | Hole size: 3.0mm | Cord or split ring attachment | Clasp must swivel 360° freely to prevent cord twisting on backpacks. |
| **Silicone Bead Material** | Food-grade silicone | Non-toxic, BPA-free, lead-free | Meets CPSIA standards; odorless, washable with mild soap. |
| **Safety Warning** | Small parts warning | Mandatory label on all packaging | *"WARNING: CHOKING HAZARD — Small parts. Not for children under 3 years."* |

---

## 6. Packaging & Assembly Standard Operating Procedure (SOP)

### 6.1 Assembly & Kitting Workflow (Operations Line)
1. **Kit Staging:** Worker retrieves master box (`PKG-BOX-KRAFT-12X9`) and inspects clean condition.
2. **Tools & Literature Pocket:**
   - Place 2 Blunt Scissors (`TOOL-SCIS-BLUNT`) in safety sleeve.
   - Place 2 Silicone Flower Sorting Trays (`TOOL-TRAY-6COMP`).
   - Place 1 Soft Retractable Tape Measure (`TOOL-TAPE-MEAS`).
   - Insert 1 Host Master Planner Guide (`PKG-GUIDE-HOST-MSTR`) and 1 pack of 15 Guest Cards (`PKG-CARD-INSTR-SET`).
3. **Hardware & Fasteners Box:**
   - Pack 16 Pen Blanks in protective sleeve.
   - Pack 16 Swivel Keyring Clasps in hardware pouch.
   - Pack 18 pre-cut 12" elastic cords bundled with paper band.
4. **Bead Bar Compartments:**
   - Pack 48 Theme Focal Silicone Beads.
   - Pack 265 Accent Silicone Beads (165 of 15mm, 100 of 12mm).
   - Pack 35 Crystal Rondelles in miniature clear envelope.
   - Pack 60 Pooled Alphabet Cube Beads in labeled pouch.
5. **Guest Favors:**
   - Pack 16 Shimmer Organza Bags (`PKG-BAG-ORG-4X6`).
6. **Final Inspection & Seal:**
   - Scan kit barcode to verify BOM completeness.
   - Affix branded tamper-evident seal and theme label.

---

## 7. Cost Accounting & Recommended Retail Pricing

*Note: Stored in integer minor units (USD cents). All retail prices are non-binding operational models pending Korry Nelson's review.*

### 7.1 Cost of Goods Sold (COGS) Breakdown: 15-Guest Party Kit (`PK-15-TAY`)

| Line Item | Unit Cost (Cents) | Quantity | Total Cost (Cents) | Notes |
| :--- | :---: | :---: | :---: | :--- |
| Pen Blanks | 45¢ | 16 | 720¢ | Includes 1 host/spare |
| Keyring Clasps | 35¢ | 16 | 560¢ | Includes 1 host/spare |
| Elastic Stretch Cord | 5¢ | 18 | 90¢ | Pre-cut 12" strands |
| Silicone Theme Focals | 52¢ | 48 | 2,496¢ | High-grade food silicone |
| 15mm Silicone Accents | 14¢ | 165 | 2,310¢ | Solid satin matte |
| 12mm Silicone Accents | 10¢ | 100 | 1,000¢ | Solid / glitter accents |
| 8mm Rhinestone Rondelles | 6¢ | 35 | 210¢ | Crystal sparkle accents |
| Alphabet Silicone Cubes | 8¢ | 60 | 480¢ | Pooled assortment |
| Organza Gift Bags | 10¢ | 16 | 160¢ | Shimmer keepsake pouches |
| Blunt Craft Scissors (2) | 120¢ | 2 | 240¢ | Reusable host tools |
| Silicone Flower Trays (2)| 140¢ | 2 | 280¢ | Non-slip design trays |
| Retractable Tape Measure | 45¢ | 1 | 45¢ | Wrist sizing tool |
| Host Master Guide | 60¢ | 1 | 60¢ | 12-page printed booklet |
| Guest Step Cards (15-pk) | 120¢ | 1 | 120¢ | Laminated color cards |
| Presentation Box & Sleeve| 210¢ | 1 | 210¢ | Custom branded kraft box |
| Direct Assembly Labor | 1,000¢ | 1 | 1,000¢ | 20 min kitting & QA |
| **Total Landed COGS** | — | — | **$99.71 (9,971¢)** | **Raw materials + labor** |

### 7.2 Retail Pricing Architecture

| Product Code | Description | Landed COGS | Target Retail Price | Gross Margin ($) | Gross Margin (%) | Additional Guest Add-on |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **PK-15-TAY** | Taylor's Era Party Kit (15 Guests) | $99.71 | **$189.00** | $89.29 | **47.2%** | +$11.50 / guest |
| **PK-15-BOHO** | Desert Bloom Boho Kit (15 Guests) | $98.85 | **$189.00** | $90.15 | **47.7%** | +$11.50 / guest |
| **PK-15-NEON** | Glow Neon Daisy Kit (15 Guests) | $97.20 | **$189.00** | $91.80 | **48.6%** | +$11.50 / guest |
| **PK-15-PRN** | Pastel Princess Kit (15 Guests) | $100.15 | **$189.00** | $88.85 | **47.0%** | +$11.50 / guest |
| **MYS-MKR-01** | Mystery Maker Solo Box (3 Projects) | $7.85 | **$19.99** | $12.14 | **60.7%** | N/A |
| **MYS-DUO-01** | Bestie Mystery Duo (6 Projects) | $14.20 | **$34.99** | $20.79 | **59.4%** | N/A |
| **BTH-SFE-01** | Santa Fe Booth Craft (1 Project) | $1.85 | **$6.00** | $4.15 | **69.2%** | 2 for $10.00 |

*Pricing Rationale:* A ~47–49% gross margin on 15-guest kits absorbs ground shipping subsidies (~$12–$15) and Stripe processing fees (~$5.80), yielding a net contribution margin of ~38%.

---

## 8. D1 Schema Contracts & BOM Invariants for Oscar (`oscar-muwid2fm`)

To guarantee zero schema friction during D1 migrations (`BCF-7`) and prevent stock corruption:

### 8.1 Required SQL Check Constraint (QA-Enforced by Toby)
Oscar must define the `components` table with a strict constraint to ensure over-reservation fails at the database engine level:

```sql
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
  unit_of_measure TEXT NOT NULL DEFAULT 'piece',
  cost_per_unit_cents INTEGER NOT NULL,
  stock_on_hand INTEGER NOT NULL DEFAULT 0,
  stock_reserved INTEGER NOT NULL DEFAULT 0,
  safety_stock INTEGER NOT NULL DEFAULT 0,
  bin_location TEXT,
  supplier_ref TEXT,
  updated_at INTEGER NOT NULL,
  CHECK (stock_reserved >= 0),
  CHECK ((stock_on_hand - stock_reserved - safety_stock) >= 0)
);
```

### 8.2 Bill of Materials Table Schema
```sql
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
```

### 8.3 Invariant Rules for Reservation Engine (`INV-01`, `INV-02`)
1. **All-or-Nothing Atomic Batch:** A party kit reservation executes all component updates inside `env.DB.batch([...])`. If any single component exceeds available stock, the check constraint aborts the batch, triggering a full SQLite rollback.
2. **Alphabet Letters Reservation (`INV-03`):** The launch kits use a **pooled letter allowance** of 60 beads (`ALPH-SIL-WHT-BLK` or `ALPH-SIL-PST-WHT`). Personalization is not reserved per-character in Phase 1, preventing false checkout aborts on rare names.
3. **Movement Ledger Audit Trail:** Every stock change creates an immutable `inventory_movements` record with an explicit movement type:
   - `receipt`: Stock received from supplier.
   - `assembly_consume`: Raw components locked into sealed prepacked box.
   - `assembly_produce`: Sealed box added to finished stock.
   - `reservation_lock`: Cart checkout lock initiated.
   - `reservation_release`: Abandoned cart or failed payment release.
   - `sale_consume`: Order confirmed and paid.
   - `booth_sale`: Direct sale at Santa Fe Elementary booth.
   - `damage` / `correction`: Reconciled loss or manual adjustment.

---

## 9. Next Operational Hand-Offs

- [x] **Pam (`BCF-3`):** Component intake CSV completed, launch catalog defined, BOM tables calculated, pricing models structured.
- [ ] **Oscar (`BCF-7`):** Consume this BOM specification to write D1 migration seed files and implement the atomic reservation batch queries.
- [ ] **Dwight (`BCF-4`):** Review guest name inputs and staff inventory RBAC permissions against trust boundaries.
- [ ] **Michael (`BCF-5`):** Package retail pricing recommendations for Korry Nelson's review.
- [ ] **Marisol (`BCF-16`):** Execute physical prototype assembly of `PK-15-TAY` using Section 6 SOP and Guest Instruction Cards.
