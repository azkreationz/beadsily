# Deliverable BCF-8: Storefront UI Component Primitives & Tailwind Tokens

**Author:** Erin (`erin-muwidjtc`), Storefront UX & Frontend Engineer  
**Task Reference:** `BCF-8` (Phase 1)  
**Independent Reviewers:** Karen (`karen-muwifd9v`, Brand & Creative Lead), Toby (`toby-muwie8nd`, Independent QA Certifier)  
**Status:** READY FOR REVIEW  
**Date:** October 6, 2026  
**Repository Location:** `beadsily-com` (`packages/ui` & `apps/storefront`)  

---

## 1. Executive Summary & Objective

Under contract `BCF-8`, Erin has implemented an accessible, mobile-first, brand-token-based UI component primitive library in `packages/ui` and wired it into `apps/storefront`. The design system strictly enforces Karen's brand specifications (`docs/brand/CONTRAST-VERIFICATION.md` & `docs/brand/BRAND-ASSET-MANIFEST.md`), reverse-engineered from the official 8x2ft physical canopy banner (`beadsily-canopy-banner-8x2ft.pdf`).

All components and token pairings pass **WCAG 2.2 Level AA** (with primary text and dark cards achieving **Level AAA**).

---

## 2. Reusable Component Primitive Library (`packages/ui`)

| Component | Key Props / Variants | Accessibility & Touch Standards | Brand Token Pairing |
| :--- | :--- | :--- | :--- |
| **`Button`** | `variant`: `primary`, `secondary`, `noir`, `outline`, `ghost`, `link`<br/>`size`: `sm`, `md`, `lg`<br/>`pill`: boolean (default `true`) | Minimum $44 \times 44\text{ px}$ touch target on all sizes (`sm`: 44px, `md`: 48px, `lg`: 56px).<br/>Visible focus indicator (`focus-visible:ring-4 focus-visible:ring-raspberry-500/40`).<br/>Supports `loading` (`aria-busy="true"`) and `disabled`. | **Primary CTA:** `bg-pink-500` (`#FF689D`) with `text-charcoal-950 font-bold` (`#171416`). Contrast: **6.72:1** (Passes WCAG AA Normal and AAA Large). White text on pink is strictly prohibited. |
| **`Badge`** | `variant`: `pink`, `pinkSoft`, `raspberry`, `amber`, `charcoal`, `cream`, `success`<br/>`size`: `sm`, `md`<br/>`pill`: boolean | Semantic text styling, optional pulse dot or icon. | `pink`: `bg-pink-500 text-charcoal-950` (6.72:1).<br/>`amber`: `bg-amber-100 text-charcoal-950 border-amber-300` (17.3:1 AAA).<br/>`charcoal`: `bg-charcoal-950 text-white` (18.29:1 AAA). |
| **`ProductCard`** | Party kit & mystery box configurations, price in minor units, guaranteed supplies list. | Semantic `<article>` card with `<h3>` heading.<br/>Touch-friendly button trigger.<br/>Zero horizontal overflow at 320px viewport. | Formatted integer cents ($18900 -> `$189.00`).<br/>Enforces disclosure of project counts: 15 guests = 45 projects.<br/>Mystery boxes disclose guaranteed items (e.g. 1 pen, 1 bracelet, 1 keychain = 3 projects). |
| **`QuantitySelector`** | `value`, `onChange`, `min`, `max`, `step`, `label`, `unitLabel`, `showHelperText` | Minimum $44 \times 44\text{ px}$ button targets for minus and plus.<br/>`aria-label="Decrease [label]"` and `aria-label="Increase [label]"` attributes.<br/>Live region calculation (`aria-live="polite"`). | For `unitLabel="Guests"`, automatically calculates and displays: `${value} guests = ${value * 3} finished keepsakes`. Clamps to minimum 15 for party kit mode. |
| **`HeroBanner`** | `title`, `subtitle`, `tagline`, `badge`, `primaryCta`, `secondaryCta`, `theme` (`cream` or `charcoal`), `features` | Semantic `<header>` / `<section>` landmark with `<h1>`.<br/>Responsive stacking on mobile viewports (<640px). | Dual theme support: Pearl Cream (`bg-cream-100`, text `charcoal-950`) and Charcoal Noir (`bg-charcoal-950`, text `white`, subtitle `cream-100`, accent `pink-500`). |
| **`Accordion`** | `items` array with `id`, `title`, `subtitle`, `content`, `defaultOpen`<br/>`allowMultiple`: boolean | Complies with **WAI-ARIA 1.2 Accordion Pattern**.<br/>Header button with `aria-expanded` and `aria-controls`.<br/>Panel with `role="region"` and `aria-labelledby`.<br/>Arrow keys and Enter/Space toggle. | `border-cream-300` dividers, animated 180° chevron icon rotation, `text-charcoal-950` headings, `text-charcoal-700` body copy. |

---

## 3. WCAG 2.2 AA Contrast & Invariant Verification Matrix

Per `docs/brand/CONTRAST-VERIFICATION.md`, relative luminance and contrast ratios were mathematically calculated and verified via automated tests:

$$L = 0.2126 \times R_{lin} + 0.7152 \times G_{lin} + 0.0722 \times B_{lin}, \quad CR = \frac{L_1 + 0.05}{L_2 + 0.05}$$

| Combination | Background | Foreground | Contrast Ratio | WCAG 2.2 Threshold | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Primary CTA Button** | Bubblegum Pink (`#FF689D`) | Charcoal Noir (`#171416`) | **6.72:1** | $\ge 4.5:1$ (AA Normal) / $\ge 3.0:1$ (AAA Large) | **PASS** |
| **Prohibited White CTA** | Bubblegum Pink (`#FF689D`) | Pure White (`#FFFFFF`) | **2.72:1** | $\ge 4.5:1$ | **FAIL (PROHIBITED)** |
| **Storefront Canvas** | Pearl Cream (`#FFF8EF`) | Charcoal Noir (`#171416`) | **17.36:1** | $\ge 7.0:1$ (AAA) | **PASS (AAA)** |
| **Accessible Text Link** | Pearl Cream (`#FFF8EF`) | Accessible Raspberry (`#C72B63`) | **5.04:1** | $\ge 4.5:1$ (AA Normal) | **PASS** |
| **Amber Craft Badge** | Warm Amber (`#FFF9C4`) | Charcoal Noir (`#171416`) | **17.30:1** | $\ge 7.0:1$ (AAA) | **PASS (AAA)** |
| **Amber Accent on Noir** | Charcoal Noir (`#171416`) | Amber Gold (`#FFC107`) | **10.91:1** | $\ge 7.0:1$ (AAA) | **PASS (AAA)** |
| **Noir Card Surface** | Charcoal Noir (`#171416`) | Pure White (`#FFFFFF`) | **18.29:1** | $\ge 7.0:1$ (AAA) | **PASS (AAA)** |

---

## 4. Storefront Wiring (`apps/storefront`)

The storefront application is configured with Next.js App Router and Tailwind CSS:

1. **`apps/storefront/package.json`:** Workspace dependencies `@beadsily/ui`, `@beadsily/db`, `@beadsily/auth`.
2. **`apps/storefront/tailwind.config.ts`:** Directly imports and presets `beadsilyTailwindPreset` from `@beadsily/ui`.
3. **`apps/storefront/src/app/globals.css`:** Defines CSS variables for Pearl Cream (`#FFF8EF`) background, Charcoal Noir (`#171416`) text, and WCAG 3:1 focus ring.
4. **`apps/storefront/src/app/layout.tsx`:** Standard layout with sticky header, SVG logo lockup (`/brand/beadsily-logo.svg`), Santa Fe Fall Festival announcement banner, accessible navigation links, and brand footer.
5. **`apps/storefront/src/app/page.tsx`:** Complete homepage demonstrating all 6 primitives:
   - `HeroBanner` with festival announcement and party kit value propositions.
   - Interactive 15-Guest Kit Configurator with `QuantitySelector` computing real-time project counts ($15 \text{ guests} \times 3 = 45 \text{ projects}$) and live price ($189 base + $12/extra guest).
   - `ProductCard` grid showcasing launch products (Ultimate 15-Guest Party Kit, Mystery Maker Single, Bestie Mystery Duo).
   - `Accordion` FAQ addressing kit contents, mystery box guarantees (sealed prepacked units, zero lottery mechanics), novice host instructions, and festival booth info.
   - Santa Fe Elementary Fall Festival school booth callout section.

---

## 5. Automated Test Evidence

Automated test suite `tests/ui/storefront-components.test.mjs` was executed and integrated into `tests/run-all-acceptance-tests.mjs`.

```
======================================================================
         BEADSILY MASTER ACCEPTANCE TEST MATRIX RUNNER                
======================================================================
Executing 10 test modules across 12 Acceptance Domains...
Requirements Covered:
  - CAT-01..03 : Catalog, 15-Guest 45-Project BOM, Server Quote Tamper Defense
  - INV-01..09 : Atomic Multi-Component Reservation, Zero-Row Rollback, Ledger
  - PAY-01..05 : Price Tampering Defense, Webhook Idempotency, IDOR
  - MYS-01..06 : Guaranteed Project Counts, Sealed Units, No Recurring Charges
  - SUB-01..06 : Entitlement Uniqueness, Phoenix Cutoffs, Address Isolation
  - EMAIL-01..04: Config Visibility, Bounded Retries, Decoupled Payments
  - SEC-01..03 : RBAC, CSRF, Turnstile, COPPA & Log Scrubber
  - SEO-01..02 : SSR Metadata, Product Schemas, 301 Canonical Redirects
  - EVENT-01..02: School Booth POS Rehearsal & Offline Idempotent Sync
  - KIT-01     : Novice Host Assembly Usability Verification
  - UI-01..05  : WCAG 2.2 AA Contrast, Component Primitives, 15-Guest Touch Target
======================================================================

▶ UI-01: WCAG 2.2 AA Mathematical Contrast Ratios
  ✔ Primary Button CTA: pink-500 background with charcoal-950 text satisfies WCAG AA & AAA Large (>= 6.7:1)
  ✔ Primary Button CTA: Prohibits white text on pink-500 (fails WCAG AA at 2.72:1)
  ✔ Storefront Canvas: charcoal-950 text on Pearl Cream cream-100 exceeds WCAG AAA (>= 17:1)
  ✔ Accessible Text Link: raspberry.text on cream-100 satisfies WCAG AA Normal Text (>= 5.0:1)
  ✔ Craft Accent: charcoal-950 on amber-100 badge exceeds WCAG AAA (>= 16:1)
  ✔ Craft Accent: amber-500 on charcoal-950 noir card exceeds WCAG AAA (>= 10.5:1)
  ✔ Dark Card / Noir Surface: white text on charcoal-950 exceeds WCAG AAA (>= 18:1)
✔ UI-01: WCAG 2.2 AA Mathematical Contrast Ratios

▶ UI-02: Button Component Tokens & Invariants
  ✔ Primary Button includes pink-500 fill, charcoal-950 text, and never standalone text-white
  ✔ Secondary Button includes cream-100 fill and charcoal-950 border/text
  ✔ Noir Button includes charcoal-950 fill and white text
  ✔ Button sizes enforce minimum 44px touch targets (WCAG 2.5.5 / 2.5.8)
  ✔ Focus rings provide high-contrast visible focus indicators
✔ UI-02: Button Component Tokens & Invariants

▶ UI-03: Badge Component Tokens & Invariants
  ✔ Pink Badge pairs pink-500 with charcoal-950, never white
  ✔ Amber Badge pairs amber-100 with charcoal-950 and amber-300 border for AAA contrast
  ✔ Charcoal Badge pairs charcoal-950 with white text
✔ UI-03: Badge Component Tokens & Invariants

▶ UI-04: Currency Formatting & Pricing Math
  ✔ formatCurrency correctly formats integer minor units into USD dollars
  ✔ 15-Guest Party Kit base calculation yields 45 finished keepsakes
  ✔ Dynamic increment calculation for 20 guests yields 60 finished keepsakes
  ✔ Party Kit calculation rejects invalid guest count < 15
✔ UI-04: Currency Formatting & Pricing Math

▶ UI-05: Tailwind Preset Theme Integrity
  ✔ Preset extends brand colors with correct hexadecimal values
  ✔ Preset extends typography font families and font sizes
  ✔ Preset extends border radii and elevation shadows
✔ UI-05: Tailwind Preset Theme Integrity

ℹ tests 105
ℹ suites 37
ℹ pass 105
ℹ fail 0
```

---

## 6. Submission for Independent Review

Submitted for review to:
- **Karen (`karen-muwifd9v`)**: For brand token fidelity, visual typography alignment with the canopy master, and packaging asset integration.
- **Toby (`toby-muwie8nd`)**: For WCAG 2.2 AA certification, touch target dimensions ($\ge 44 \times 44\text{ px}$), keyboard navigation, and acceptance matrix verification.
