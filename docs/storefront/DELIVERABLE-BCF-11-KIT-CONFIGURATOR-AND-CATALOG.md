# Deliverable BCF-11: Responsive 15-Guest Kit Configurator & Catalog UI

**Author:** Erin (`erin-muwidjtc`), Storefront UX & Frontend Engineer  
**Task Reference:** `BCF-11` (Phase 2)  
**Independent Reviewer:** Toby (`toby-muwie8nd`, Independent QA & Compliance Certifier)  
**Status:** READY FOR REVIEW  
**Date:** October 6, 2026  
**Repository Location:** `beadsily-com` (`apps/storefront`)  

---

## 1. Executive Summary & Objective

Under contract `BCF-11`, Erin has built the interactive, responsive 15-guest party kit customization configurator and dedicated catalog interfaces in `apps/storefront`. The system strictly implements the requirements of `MISSION-BEADSILY-COMMERCE.md` and `docs/inventory/LAUNCH-CATALOG-AND-BOM-SPECIFICATION.md`:

1. **Ironclad 15-Guest Base Invariant (CAT-01):** The party kit starts with a hard minimum of 15 guests, guaranteeing **45 complete finished craft keepsakes** (3 per guest: 1 beadable metallic pen, 1 swivel carabiner keychain, 1 stretch bead bracelet).
2. **Dynamic Guest Scaling:** Real-time client and server pricing at **$189.00 base** (15 guests, $12.60/guest) plus **$12.00 per additional guest** (up to 30 guests max), with component BOM allocations scaling dynamically (+3 projects/guest).
3. **Four Validated Launch Themes:**
   - **`Taylor's Era Friendship`:** Heart sunglasses & glitter disco focals, pastel pink/lilac palette, silver hardware, friendship alphabet letters.
   - **`Desert Bloom & Boho`:** Saguaro blossoms & rising sun focals, terracotta/sage palette, rose gold hardware.
   - **`Glow & Neon Retro Daisy`:** Daisy smileys & electric starburst focals, neon yellow/hot pink palette, silver hardware.
   - **`Pastel Princess & Mermaid Cove`:** Tiara crowns & fairy butterfly focals, lilac/gold palette, gold hardware.
4. **Mobile-First Accessibility & Touch Standards:** Zero horizontal overflow across viewports from 320px to 4K, all interactive steppers/buttons $\ge 44 \times 44\text{ px}$, and full WAI-ARIA announcements.

---

## 2. Storefront Pages & Components Implemented

### 2.1. `KitConfigurator` (`apps/storefront/src/components/KitConfigurator.tsx`)
- **Interactive Theme Selector:** Visual selection radio group with 4-swatch color palette indicators, theme taglines, and auto-synced hardware defaults.
- **Dynamic Quantity Stepper (`QuantitySelector`):** Constrained to $15 \le N \le 30$ guests with live project calculation `${N} guests = ${N * 3} finished keepsakes`.
- **Hardware Finish Chooser:** Silver, Rose Gold, and Champagne Gold finishes with minimum 44px touch targets.
- **Alphabet Personalization:** Checkbox toggle for 60 pooled alphabet cube beads for personalized bracelets.
- **Live Packout Preview:** Real-time itemized BOM accounting for pens, keychains, cords, focals, accents, and host tools.
- **Transparent Price Tag:** Displays formatted total ($189.00–$369.00) and cost per guest.

### 2.2. Dedicated Catalog Pages
1. **`/party-kits` (`apps/storefront/src/app/party-kits/page.tsx`):**
   - Renders the interactive `KitConfigurator`.
   - Grid of all 4 validated 15-guest launch themes with detailed supply guarantees, badge overlays, and stock indicators.
2. **`/mystery-boxes` (`apps/storefront/src/app/mystery-boxes/page.tsx`):**
   - Curated mystery boxes: **Mystery Maker Solo** ($28, 3 projects) and **Bestie Mystery Duo** ($48, 6 projects).
   - Clear project guarantee disclosures and physical sealed unit invariants (no virtual roulette wheels or subscription traps).
   - Transparency FAQ accordion.

---

## 3. Mathematical Pricing & BOM Scaling Formulas

$$\text{TotalPriceCents}(N) = 18900 + \max(0, N - 15) \times 1200$$

$$\text{TotalFinishedProjects}(N) = N \times 3$$

$$\text{CostPerGuestCents}(N) = \left\lfloor \frac{\text{TotalPriceCents}(N)}{N} \right\rfloor$$

| Guest Count ($N$) | Extra Guests | Total Price | Total Projects | Cost / Guest | Pen & Keyring Allocation | Silicone Focals | Round Accents |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **15 (Base)** | 0 | **$189.00** | **45** | **$12.60** | 16 pens, 16 clasps (+1 spare) | 48 (+3 spares) | 265 (+25 spares) |
| **16** | 1 | **$201.00** | **48** | **$12.56** | 17 pens, 17 clasps | 51 focals | 283 accents |
| **20** | 5 | **$249.00** | **60** | **$12.45** | 21 pens, 21 clasps | 63 focals | 355 accents |
| **25** | 10 | **$309.00** | **75** | **$12.36** | 26 pens, 26 clasps | 78 focals | 445 accents |
| **30 (Max)** | 15 | **$369.00** | **90** | **$12.30** | 31 pens, 31 clasps | 93 focals | 535 accents |

---

## 4. Automated Verification Test Suite

Test suite `tests/ui/storefront-components.test.mjs` was extended with `UI-06` and `UI-07` and executed as part of `tests/run-all-acceptance-tests.mjs`:

```
▶ UI-06: 15-Guest Kit Configurator Dynamic Pricing & Theme Invariants (BCF-11)
  ✔ Base 15-guest calculation: $189.00 total (18900 cents) for 45 finished keepsakes ($12.60/guest)
  ✔ Adding 1 extra guest (16 guests): $201.00 total (+$12.00, 48 projects)
  ✔ Adding 5 extra guests (20 guests): $249.00 total (+$60.00, 60 projects)
  ✔ Adding 15 extra guests (30 guests max): $369.00 total (+$180.00, 90 projects)
  ✔ Guest count clamping enforces minimum 15 and maximum 30 guests
  ✔ All 4 launch themes are verified with valid palettes and hardware defaults
✔ UI-06: 15-Guest Kit Configurator Dynamic Pricing & Theme Invariants (BCF-11)

▶ UI-07: Mobile Viewport & Touch Target Invariants
  ✔ All interactive steppers and buttons meet minimum 44px touch targets
✔ UI-07: Mobile Viewport & Touch Target Invariants

ℹ tests 112
ℹ suites 39
ℹ pass 112
ℹ fail 0
```

---

## 5. Submission for Independent Certification

Submitted to:
- **Toby (`toby-muwie8nd`)**: For independent QA certification of `BCF-11` (catalog navigation, dynamic configurator calculations, keyboard navigation, and zero horizontal scroll at 320px viewport).
