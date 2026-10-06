# Deliverable BCF-12: Stripe Embedded Payment Element & Checkout Integration

**Document Version:** 1.0.0  
**Phase:** Phase 2 Launch Slice & Payments (`BCF-12`)  
**Lead:** Angela (`angela-muwif3s4`), Commercial Payments & Subscription Lead  
**Designated QA Reviewer:** Toby (`toby-muwie8nd`), Independent QA Certifier  
**Designated Security Reviewer:** Dwight (`dwight-muwicook`), Security & Privacy Lead  
**Orchestrator:** Michael (`god`)  
**Governing Mission:** [`MISSION-BEADSILY-COMMERCE.md`](file:///C:/repositories/beadsily-com-floor/missions/MISSION-BEADSILY-COMMERCE.md)  
**Acceptance Criteria Impact:** `PAY-01`, `PAY-02`, `PAY-03`, `PAY-04`, `PAY-05`, `INV-01`, `INV-02`, `INV-06`, `MYS-03`, `MYS-05`  
**Status:** READY FOR REVIEW

---

## 1. Executive Summary & Objective

Under contract `BCF-12`, Angela has implemented the server-authoritative Stripe Embedded Checkout engine, secure webhook ingestion pipeline, and storefront checkout user journey in `beadsily-com`. The solution fulfills all financial integrity, cryptographic verification, and inventory reservation requirements established in [`ADR-002`](file:///C:/repositories/beadsily-com-floor/worktrees/angela-muwif3s4/docs/architecture/ADR-002-PAYMENTS-AND-SUBSCRIPTIONS.md):

1. **Server-Derived Pricing & Tamper Defense (`PAY-01`):** Client-submitted unit prices, discounts, and reported totals are strictly discarded. All order totals are derived from authoritative D1 catalog records and pricing rules ($189.00 for 15 guests / 45 projects, +$12.00 per add-on guest, free shipping over $100.00, 8.6% AZ sales tax).
2. **Provider Evidence Requirement (`PAY-02`):** Return URLs and client redirect parameters cannot mark an order paid. Orders remain in `pending` state until cryptographic webhook proof arrives from Stripe.
3. **Cryptographic Webhook Signature & Replay Deduplication (`PAY-03`, `PAY-04`):** Constant-time HMAC-SHA256 signature verification over raw request bodies with a 300s clock skew window. Two-phase commit into D1 `webhook_events` ensures duplicate webhook events return HTTP 200 with zero duplicate inventory consumption.
4. **Pre-Payment Inventory Lock & Reservation (`INV-01`, `INV-02`, `INV-06`):** Initiating checkout atomically locks component inventory in D1. If stock is insufficient, the checkout session is rejected with an explicit error and temporary locks are safely released.
5. **Curated Mystery Box Physical Commerce (`MYS-03`, `MYS-05`):** Curated mystery boxes allocate prepacked sealed units in inventory and execute strictly under one-time payment mode, never enrolling buyers in recurring subscriptions.
6. **Customer Portal IDOR Defense (`PAY-05`):** Billing portal sessions enforce strict caller identity checks (rejecting attempts to access another customer's billing session) and validate return URLs against a trusted origin allowlist.

---

## 2. Package Architecture: `@beadsily/payments`

The new shared package `packages/payments` provides reusable, edge-compatible payment processing primitives:

```
packages/payments/
├── package.json
└── src/
    ├── index.mjs / index.ts         # Public module exports
    ├── pricing.mjs / pricing.ts     # Authoritative server pricing engine (PAY-01)
    ├── stripe-client.mjs / .ts      # Edge-compatible Stripe client & test sandbox provider
    ├── checkout-session.mjs / .ts   # Embedded checkout session creation with D1 inventory locks
    ├── webhook-handler.mjs / .ts    # Cryptographic signature & idempotent replay handler (PAY-03/04)
    └── billing-portal.mjs / .ts     # Billing portal generator with IDOR defense (PAY-05)
```

### 2.1 Authoritative Pricing Formulas
$$\text{KitSubtotalCents}(N) = 18900 + \max(0, N - 15) \times 1200$$
$$\text{ShippingCents} = \begin{cases} 0 & \text{if Subtotal} \ge 10000\text{ cents} \\ 995 & \text{otherwise} \end{cases}$$
$$\text{TaxCents} = \text{round}(\text{Subtotal} \times 0.086)$$
$$\text{TotalCents} = \text{Subtotal} + \text{Shipping} + \text{Tax}$$

---

## 3. Storefront Integration (`apps/storefront`)

### 3.1 API Endpoints
1. **`POST /api/checkout/session` (`apps/storefront/src/app/api/checkout/session/route.ts`):**
   - Ingests cart items and customer email.
   - Computes server-authoritative totals.
   - Reserves BOM components or allocates sealed mystery units in D1.
   - Creates Stripe Embedded Checkout session (`ui_mode: 'embedded'`, `mode: 'payment'`).
   - Inserts pending D1 order and order items.
   - Returns client secret for mounting in the frontend.

2. **`POST /api/webhooks/stripe` (`apps/storefront/src/app/api/webhooks/stripe/route.ts`):**
   - Receives raw HTTP body and `stripe-signature` header.
   - Cryptographically validates HMAC-SHA256 signature.
   - Checks `webhook_events` table for duplicate delivery.
   - On `checkout.session.completed`, marks order `'paid'`, sets `paid_at`, and consumes inventory in D1 movement ledger.
   - On `payment_intent.payment_failed`, releases reservation locks and cancels order.

### 3.2 User Interface Pages
1. **`/checkout` (`apps/storefront/src/app/checkout/page.tsx`):**
   - Mobile-first, WCAG 2.2 AA compliant embedded checkout interface.
   - Live order summary showing 15-guest calculation ($189.00 base, 45 keepsakes, +$12.00/guest).
   - Mounts Stripe Embedded Payment Element container (`#checkout-container`).
   - COPPA notice: adult purchasers only (18+). Small parts choking hazard warning.
2. **`/checkout/return` (`apps/storefront/src/app/checkout/return/page.tsx`):**
   - Polls server for cryptographic payment verification.
   - Discloses that redirect URLs alone cannot mark an order paid (`PAY-02`).

---

## 4. Verification Evidence & Test Execution

### 4.1 Integration Test Suite
Authored [`tests/payments/embedded-checkout-integration.test.mjs`](file:///C:/repositories/beadsily-com-floor/worktrees/angela-muwif3s4/tests/payments/embedded-checkout-integration.test.mjs) verifying all acceptance requirements:

```
TAP version 13
# Subtest: BCF-12: Stripe Embedded Checkout & Payments Integration
    ok 1 - PAY-01: Server strictly enforces canonical prices and discards client tampering
    ok 2 - PAY-01: Dynamic guest count scaling calculates correct project and monetary amounts
    ok 3 - PAY-02: Order remains in pending state until verified by provider webhook
    ok 4 - PAY-03 & PAY-04: Webhook verifies signature, commits D1 stock reservation, and handles replays idempotently
    ok 5 - PAY-03: Webhook with forged or tampered HMAC signature is rejected with error
    ok 6 - MYS-03 & MYS-05: Curated mystery box allocates sealed unit and completes in one-time mode
    ok 7 - PAY-05: Customer Portal enforces customer isolation and rejects IDOR requests
ok 1 - BCF-12: Stripe Embedded Checkout & Payments Integration
# tests 7
# suites 1
# pass 7
# fail 0
```

### 4.2 Full Master Matrix Suite
Executed [`tests/run-all-acceptance-tests.mjs`](file:///C:/repositories/beadsily-com-floor/worktrees/angela-muwif3s4/tests/run-all-acceptance-tests.mjs):
- **Total Tests:** 119
- **Total Suites:** 40
- **Pass Rate:** 100% (119/119 passing, 0 failures)

---

## 5. Submission for Review
- **Toby (`toby-muwie8nd`):** For independent QA certification of `BCF-12` (Stripe embedded session creation, webhook idempotency replay resistance, and D1 inventory reservation commitment).
- **Dwight (`dwight-muwicook`):** For security review of HMAC signature verification, IDOR defense on billing portals, and server-authoritative price recalculation.
