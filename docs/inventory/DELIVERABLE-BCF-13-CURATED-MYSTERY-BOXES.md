# Deliverable Report: BCF-13 Curated Mystery Box Catalog & Sealed-Unit Allocation

**Ticket:** `BCF-13` (Phase 2: Curated Mystery Box Catalog & Sealed-Unit Allocation)  
**Author:** Oscar (`oscar-muwid2fm`), Backend Data & Inventory Engineer  
**Compliance & QA Certifier:** Toby (`toby-muwie8nd`), Independent QA Certifier  
**Technical Architect:** Jim (`jim-muwibr7y`), Technical Architect  
**Product / Operations Review:** Pam (`pam-muwic8fg`), Product Operations  
**Commercial / Payments Review:** Angela (`angela-muwif3s4`), Commercial Payments  
**Status:** Completed & Ready for Review  
**Date:** October 6, 2026  

---

## 1. Executive Summary

This deliverable implements the complete server, repository, and storefront API architecture for BeadsILY's **Curated Mystery Craft Boxes** (`MYS-01` through `MYS-06` in [`missions/ACCEPTANCE-MATRIX.md`](file:///C:/repositories/beadsily-com-floor/missions/ACCEPTANCE-MATRIX.md)).

Curated Mystery Boxes represent physical assortment merchandise where project counts and supply quality are 100% guaranteed, but theme styling, palettes, and silicone focal charms remain an unboxing surprise. The implementation completely eliminates gambling mechanics, virtual lottery wheels, and recurring subscription enrollment.

---

## 2. Requirements Traceability Matrix

| Requirement | Acceptance Criteria | Implementation Component | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **`MYS-01`** | **Guaranteed Project Counts by Tier:** Exact project counts and complete hardware supplies match page, order, actual box, and internal recipe. | [`packages/db/src/mystery.mjs`](file:///C:/repositories/beadsily-com-floor/worktrees/oscar-muwid2fm/packages/db/src/mystery.mjs) (`MYSTERY_TIERS`, `validateMysteryTierGuarantees`) | Mystery Maker Solo: 3 projects (1 pen, 1 keychain, 1 bracelet). Bestie Duo: 6 projects (2 pens, 2 keychains, 2 bracelets). Mystery Party: 45 projects (15 pens, 15 keychains, 15 bracelets). |
| **`MYS-02`** | **Prepack Sealed Units & Ledger Audit:** Prepacking consumes raw supplies immediately from `components` stock; sealed box counted as finished stock; no double consumption or oversell. | [`packages/db/src/mystery.mjs`](file:///C:/repositories/beadsily-com-floor/worktrees/oscar-muwid2fm/packages/db/src/mystery.mjs) (`prepackSealedMysteryUnit`) | Raw inventory decremented at packout; immutable movement recorded (`movement_type: 'assembly_consume'`); unit stored in `mystery_sealed_units` as `status: 'assembled'`. |
| **`MYS-03`** | **Race Condition & Persistent Allocation:** Two buyers race for final sealed unit; webhook or request retries retain identical persistent allocation without rerolling or reassigning. | [`packages/db/src/mystery.mjs`](file:///C:/repositories/beadsily-com-floor/worktrees/oscar-muwid2fm/packages/db/src/mystery.mjs) (`allocateSealedMysteryUnit`) | Atomic reservation transaction locks unit; second buyer receives `OUT_OF_STOCK`; retries by same session or order return identical unit (`retried: true`). |
| **`MYS-04`** | **Customer Repeat Avoidance & Variety Guarantee:** Honest best-effort repeat avoidance policy; firm variety guarantee enforced or purchase prevented. | [`packages/db/src/mystery.mjs`](file:///C:/repositories/beadsily-com-floor/worktrees/oscar-muwid2fm/packages/db/src/mystery.mjs) (`allocateSealedMysteryUnit`) | Compares against `customerPreviousThemes`; selects novel theme if in stock; flags `repeatTheme: true` under best-effort; rejects with `VARIETY_GUARANTEE_UNAVAILABLE` if firm guarantee requested. |
| **`MYS-05`** | **Public API Privacy & Zero Recurring Billing:** Internal surprise contents (focals, warehouse bins) never leaked before delivery; strictly zero recurring billing for mystery boxes. | [`packages/db/src/mystery.mjs`](file:///C:/repositories/beadsily-com-floor/worktrees/oscar-muwid2fm/packages/db/src/mystery.mjs) (`sanitizeMysteryUnitForPublicClient`, `validateMysteryNoSubscription`) | Strips `contents_snapshot`, `internalSurpriseFocals`, `bin_location`; throws `ILLEGAL_STATE` if `isSubscription: true` or `recurring` mode requested. |
| **`MYS-06`** | **Damaged Returns & Packed Contents Audit:** Replacement/refund workflow references actual packed contents snapshot; usable physical returns restock only with QA physical inspection. | [`packages/db/src/mystery.mjs`](file:///C:/repositories/beadsily-com-floor/worktrees/oscar-muwid2fm/packages/db/src/mystery.mjs) (`auditMysteryRestock`) | Inspects `contents_snapshot` of lot; sets `status: 'damaged'`; prevents uninspected units from returning to saleable inventory. Restock requires `restockEligible: true`. |

---

## 3. Architecture & API Endpoints

### 3.1 Module `@beadsily/db` Mystery Engine
- Located in [`packages/db/src/mystery.mjs`](file:///C:/repositories/beadsily-com-floor/worktrees/oscar-muwid2fm/packages/db/src/mystery.mjs) and re-exported via [`packages/db/src/index.mjs`](file:///C:/repositories/beadsily-com-floor/worktrees/oscar-muwid2fm/packages/db/src/index.mjs).
- Functions:
  - `getMysteryCatalog(db)`
  - `validateMysteryTierGuarantees()`
  - `prepackSealedMysteryUnit(db, params)`
  - `allocateSealedMysteryUnit(db, params)`
  - `releaseMysteryReservation(db, sessionId)`
  - `commitMysteryUnitSale(db, params)`
  - `sanitizeMysteryUnitForPublicClient(unit)`
  - `validateMysteryNoSubscription(payload)`
  - `auditMysteryRestock(db, params)`

### 3.2 Storefront Server Routes
1. **`GET /api/mystery/catalog`** ([`apps/storefront/src/app/api/mystery/catalog/route.ts`](file:///C:/repositories/beadsily-com-floor/worktrees/oscar-muwid2fm/apps/storefront/src/app/api/mystery/catalog/route.ts)):
   - Returns public catalog of mystery box tiers with live D1 inventory stock availability and guaranteed project counts.
2. **`POST /api/mystery/allocate`** ([`apps/storefront/src/app/api/mystery/allocate/route.ts`](file:///C:/repositories/beadsily-com-floor/worktrees/oscar-muwid2fm/apps/storefront/src/app/api/mystery/allocate/route.ts)):
   - Atomically reserves a sealed unit for a checkout session with persistent idempotency and repeat theme avoidance.
3. **`POST /api/mystery/return-audit`** ([`apps/storefront/src/app/api/mystery/return-audit/route.ts`](file:///C:/repositories/beadsily-com-floor/worktrees/oscar-muwid2fm/apps/storefront/src/app/api/mystery/return-audit/route.ts)):
   - Customer care and warehouse triage endpoint verifying damaged components against the lot snapshot.

---

## 4. Verification Evidence

### 4.1 Curated Mystery Test Suite (`tests/mystery/curated-mystery-allocation.test.mjs`)
- Executed via bundled Node v22.22.0:
```
# Subtest: MYS-01: Guaranteed Project Counts by Mystery Box Tier
    ok 1 - All mystery tiers enforce exact project guarantees across recipes and catalog
ok 1 - MYS-01: Guaranteed Project Counts by Mystery Box Tier (1.58ms)

# Subtest: MYS-02: Prepack Sealed Units & Ledger Audit (No Double Consumption)
    ok 1 - Prepacking raw components consumes on-hand stock and creates finished sealed unit
ok 2 - MYS-02: Prepack Sealed Units & Ledger Audit (No Double Consumption) (2.00ms)

# Subtest: MYS-03: Two Buyers Race for Final Unit & Webhook Retry Idempotency
    ok 1 - Race condition: First buyer secures unit, second buyer gets OUT_OF_STOCK
ok 3 - MYS-03: Two Buyers Race for Final Unit & Webhook Retry Idempotency (1.76ms)

# Subtest: MYS-04: Customer Preferences & Honest Best-Effort Repeat Avoidance
    ok 1 - Customer who previously received Unicorn gets Celestial unit
    ok 2 - Honest repeat policy: If only previously received theme is available, flags repeat
    ok 3 - Firm variety guarantee prevents purchase if novel theme unavailable
ok 4 - MYS-04: Customer Preferences & Honest Best-Effort Repeat Avoidance (5.47ms)

# Subtest: MYS-05: API Privacy Sanitization & No Recurring Subscriptions
    ok 1 - Public API sanitizes internal surprise focal details and warehouse bin
    ok 2 - validateMysteryNoSubscription rejects subscription enrollment for mystery boxes
ok 5 - MYS-05: API Privacy Sanitization & No Recurring Subscriptions (0.88ms)

# Subtest: MYS-06: Damaged Returns & Missing Contents Audit
    ok 1 - Support audit references actual packed contents snapshot and prevents uncertified restock
    ok 2 - Restock succeeds only when explicitly certified as restockEligible by QA
ok 6 - MYS-06: Damaged Returns & Missing Contents Audit (2.26ms)

# Subtest: Catalog Query: getMysteryCatalog
    ok 1 - getMysteryCatalog returns accurate live stock tallies
ok 7 - Catalog Query: getMysteryCatalog (1.23ms)

# tests 11
# pass 11
# fail 0
```

### 4.2 Master Acceptance Test Suite (`tests/run-all-acceptance-tests.mjs`)
- **Total Tests Passing:** **163 / 163 Tests (100% Pass) across 54 suites**.
- Clean execution across all 12 acceptance domains.

---

## 5. Review & Integration Handoff

- **Branch:** `agent/oscar-muwid2fm`
- **Reviewer:** Toby (`toby-muwie8nd`), Independent QA Certifier
- **Integrator:** Michael (`god`)
