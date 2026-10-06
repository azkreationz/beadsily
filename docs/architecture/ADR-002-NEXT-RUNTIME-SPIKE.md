# ADR-002: Next.js Runtime Compatibility Spike & Cloudflare Edge Services Architecture

**Date:** October 6, 2026  
**Status:** ACCEPTED (Architectural Decision Record)  
**Authors:** Jim (Cloudflare Solutions Architect)  
**Reviewers:** Dwight (Security & Privacy Lead), Toby (Independent QA Certifier), Michael (god)  
**Mission Reference:** [`MISSION-BEADSILY-COMMERCE.md`](file:///C:/repositories/beadsily-com-floor/missions/MISSION-BEADSILY-COMMERCE.md)  
**Task Reference:** `BCF-2`

---

## 1. Context & Business Drivers

BeadsILY requires a high-performance, single-merchant direct-to-consumer commerce storefront and operations backend deployed on Cloudflare Workers. The storefront must support:
- Accessible mobile-first shopping with server-side rendered (SSR) product catalogs and occasion landing pages for maximum SEO crawlability.
- Dynamic 15-guest party kit customization (base 15 guests = 45 finished projects, add-on guest increments, theme palettes, and letter personalization).
- Curated mystery craft boxes (guaranteed project counts with surprise styling, allocated as sealed prepacked units).
- Physical monthly subscription boxes with explicit cutoff, pause/skip, and fulfillment entitlement controls.
- Fast mobile destination loading for the October 23, 2026 Santa Fe Elementary School booth QR code.

The Cloudflare Workers ecosystem offers two primary pathways for deploying Next.js applications:
1. **`vinext`**: Cloudflare's Vite-based plugin that reimplements the Next.js API surface natively for Vite and Cloudflare Workers.
2. **`@opennextjs/cloudflare`**: An adapter that takes the standard `next build` output (`.next/standalone`) and transforms it to run on Workers using `nodejs_compat`.

Furthermore, per `MISSION-BEADSILY-COMMERCE.md`, Jim was tasked with proving critical runtime invariants:
- D1 atomic multi-component BOM reservation and resolution of the "zero-row UPDATE" silent success hazard.
- Stripe SDK signature verification and raw-body webhook handling on Workers.
- Zero-dependency Web Crypto session authentication without heavyweight Firebase dependencies.
- Cloudflare R2 media storage and transactional email sending pipelines.

---

## 2. Comparative Analysis: `vinext` vs `@opennextjs/cloudflare`

| Evaluation Dimension | `vinext` (Vite-Powered Next.js) | `@opennextjs/cloudflare` (OpenNext Adapter) | BeadsILY Assessment |
| :--- | :--- | :--- | :--- |
| **Architectural Model** | Native compilation via Vite & Rollup directly into Cloudflare Worker bundle. | Post-build transformation of standard `next build` server output. | `vinext` avoids reverse-engineering Next.js internal server bundles. |
| **Cloudflare Bindings** | Direct access via `cloudflare:workers` or request context `(req, env, ctx)`. | Accessed via `getCloudflareContext()` import helper. | Both provide access to D1, R2, Queues, and Email bindings; `vinext` is slightly cleaner. |
| **Cold Start & Latency** | Ultra-lean bundle (~5–15ms cold start). No Node.js server emulation shims. | Moderate bundle size (~25–50ms cold start) due to Next server emulation layer. | `vinext` yields superior mobile LCP for festival booth QR scans. |
| **Developer Experience** | Sub-second Vite HMR during local storefront development. | Standard Next.js dev server with wrapper build step. | Vite dev cycle is significantly faster for UI iterations. |
| **Ecosystem & Build** | Requires Vite-compatible plugins. Certain Webpack-specific Next loaders require Vite equivalents. | High compatibility with Webpack Next plugins and raw Next.js internals. | BeadsILY is a greenfield repo using modern ESM and Tailwind; no legacy Webpack baggage. |
| **Maturity & Support** | Officially endorsed and actively developed by Cloudflare for greenfield Next apps (v1.0 reached in 2026). | Mature, battle-tested by community across major legacy Next.js deployments. | Cloudflare docs explicitly recommend `vinext` for new applications while maintaining OpenNext as fallback. |

### Architectural Decision
**Primary Selection: `vinext` for `apps/storefront` + Native Worker for `apps/operations-worker`**
- **Storefront (`apps/storefront`):** Deploy Next.js App Router on Cloudflare Workers powered by `vinext`. This provides instant SSR, dynamic OpenGraph/metadata generation, native Cloudflare bindings, and rapid Vite HMR.
- **Operations & Background (`apps/operations-worker`):** Deploy a dedicated, lean Cloudflare Worker handling Cloudflare Queues, scheduled reconciliation crons, and Cloudflare Email Sending outbox processing. Decoupling operations from the Next.js storefront prevents background processing from bloating storefront bundle size.
- **Fallback Guardrail:** If an unforeseen Next.js App Router edge case is encountered during Phase 1 UI construction, the clean domain separation in `packages/*` allows seamless fallback to `@opennextjs/cloudflare` with zero rewrite of business logic or schemas.

---

## 3. Empirical Spike Findings & Proven Invariants

A comprehensive runtime spike was built and executed under `spike/test-suite.mjs` and verified against Wrangler local D1 (`wrangler d1 execute --local`). All tests passed cleanly.

```
===============================================================
BeadsILY Architecture Compatibility & Runtime Spike Test Suite
===============================================================
--- Test Suite 1: D1 Inventory Atomicity & Batch Rollback ---
1.1: Verifying initial stock states:
✅ PASSED: Initial pen stock is 50 on-hand, 0 reserved
1.2: Executing successful atomic reservation across 4 components:
Transaction committed successfully.
✅ PASSED: Pen reserved stock successfully increased to 15
✅ PASSED: Accent beads reserved stock successfully increased to 270
1.3: Testing stock shortage failure and proving ALL-OR-NOTHING batch rollback:
✅ PASSED: Trigger raised expected exception: INSUFFICIENT_STOCK: Stock reserved exceeds available inventory minus safety stock
✅ PASSED: Transaction was aborted and rolled back due to trigger exception
✅ PASSED: Pen stock reservation remained exactly 15 (rolled back completely, zero partial allocation leakage)

--- Test Suite 2: Stripe Webhook Replay Resistance & Idempotency ---
✅ PASSED: First webhook event processed successfully
✅ PASSED: Duplicate webhook delivery idempotently rejected with zero duplicate side-effects

--- Test Suite 3: Zero-Dependency Web Crypto Session Auth ---
✅ PASSED: Created valid HMAC-SHA256 signed session token
✅ PASSED: Verified session payload matches original user ID
✅ PASSED: Tampered token signature verification correctly failed

--- Test Suite 4: SSR Metadata & Product Schema Generation ---
✅ PASSED: Generated accurate SSR Page Title
✅ PASSED: Formatted accurate Schema.org offer price from minor units
✅ PASSED: Schema correctly reflects in-stock status

===============================================================
🎉 ALL ARCHITECTURE SPIKE TESTS PASSED SUCCESSFULLY!
===============================================================
```

### 3.1 D1 Inventory Atomicity & The "Zero-Row UPDATE" Invariant (INV-01, INV-02)

#### The Hazard
In standard SQLite and Cloudflare D1:
```sql
UPDATE components 
SET stock_reserved = stock_reserved + 15, updated_at = 1728212400000 
WHERE id = 'comp-pen' AND (stock_on_hand - stock_reserved - safety_stock) >= 15;
```
If `(stock_on_hand - stock_reserved - safety_stock) < 15`, SQLite does **not** throw an error! It simply reports `changes = 0`.  
In a multi-statement `db.batch([stmt1, stmt2, stmt3, stmt4])`, D1 executes all statements; statements with sufficient stock succeed, while statements with insufficient stock silently update zero rows. This results in catastrophic partial kit reservations (e.g. 15 pens and 15 keychains are locked, but beads failed, corrupting inventory availability).

#### The Proven Architectural Solution
We proved that an SQLite `BEFORE UPDATE` trigger on `components` transforms insufficient stock into a hard `SQLITE_CONSTRAINT_TRIGGER` error:
```sql
CREATE TRIGGER IF NOT EXISTS trg_enforce_stock_reservation
BEFORE UPDATE OF stock_reserved ON components
FOR EACH ROW
WHEN (NEW.stock_reserved > OLD.stock_reserved) AND (NEW.stock_reserved > (NEW.stock_on_hand - NEW.safety_stock))
BEGIN
  SELECT RAISE(ABORT, 'INSUFFICIENT_STOCK: Stock reserved exceeds available inventory minus safety stock');
END;
```

#### Wrangler Local D1 Verification
When tested against Wrangler D1 local (`npx wrangler d1 execute beadsily-local-db --local --file spike/test-trigger-fail.sql`), the trigger instantly aborted execution:
```
X [ERROR] INSUFFICIENT_STOCK: Stock reserved exceeds available inventory minus safety stock: SQLITE_CONSTRAINT (extended: SQLITE_CONSTRAINT_TRIGGER)
```
**Conclusion for Oscar & Toby:** When using D1 batch transactions for multi-component BOM reservations, this trigger guarantees that an over-reservation rolls back the entire batch atomically, satisfying `INV-01` and `INV-02`.

---

### 3.2 Stripe SDK & Webhook Processing on Workers Edge

#### Runtime Compatibility
In Cloudflare Workers with `nodejs_compat` enabled, the standard `stripe` npm package is fully supported by configuring the fetch HTTP client:
```typescript
import Stripe from 'stripe';

export function getStripeClient(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: '2025-01-27.acacia' as any,
    httpClient: Stripe.createFetchHttpClient(),
  });
}
```

#### Signature Verification & Body Invariant
Workers route handlers must parse webhooks using `await request.text()` to preserve the exact raw body string for cryptographic signature verification:
```typescript
const signature = request.headers.get('stripe-signature');
const rawBody = await request.text();
const event = await stripe.webhooks.constructEventAsync(
  rawBody,
  signature!,
  env.STRIPE_WEBHOOK_SECRET
);
```

#### Idempotency & Replay Resistance (PAY-03)
Webhooks are recorded durably in D1 before business processing:
```sql
INSERT INTO webhook_events (event_id, event_type, status, created_at)
VALUES (?, ?, 'pending', ?);
```
If a replayed or duplicate webhook arrives, the `PRIMARY KEY (event_id)` constraint fails, allowing the Worker to return `200 OK` immediately without repeating fulfillment or customer emails.

---

### 3.3 Zero-Dependency Edge Authentication (Dwight RBAC & Sessions)

#### Architecture
Instead of importing heavy Firebase Auth or Node-specific JWT libraries, BeadsILY utilizes native Web Crypto (`crypto.subtle`) available in the Workers runtime:
- **Customer Auth:** Magic links / passwordless email codes verified against short-lived D1 tokens.
- **Session Tokens:** Compact HMAC-SHA256 signed tokens stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
- **Staff Access:** Cloudflare Access JWT validation middleware at the edge (`Cf-Access-Jwt-Assertion`) mapped to internal role permissions (`owner`, `inventory_mgr`, `packer`, `support`).

---

### 3.4 Media & Asset Topology (Cloudflare R2)

- **Bucket Configuration:** Pinned R2 binding `MEDIA_BUCKET` in `wrangler.jsonc`.
- **Zero-Egress Delivery:** All approved product imagery (WebP), instruction PDFs, and brand SVGs are stored in R2.
- **CDN Domain:** Delivered over Cloudflare's edge network via `media.beadsily.com` with aggressive immutable caching (`Cache-Control: public, max-age=31536000, immutable`).
- **Canva Handoff:** Designs authored in Canva are exported directly into the R2 pipeline; the public site has zero runtime dependency on external Canva APIs or ephemeral preview URLs.

---

### 3.5 Transactional Email & Queue Reconciliation

- **Binding:** Cloudflare Email Sending (`send_email` binding) attached to `apps/operations-worker`.
- **Domain Verification:** `beadsily.com` configured with SPF, DKIM, and DMARC DNS records.
- **Outbox Queue:** Transactional emails are committed to a D1 `email_outbox` table within the same transaction as order creation, then enqueued to Cloudflare Queues for reliable asynchronous delivery with dead-letter queue (DLQ) retry tracking.

---

## 4. Phase 1 Implementation Blueprint

With ADR-002 validated, Jim and the specialist team will execute Phase 1 under the following project layout:

```
beadsily-com/
├── apps/
│   ├── storefront/             # Next.js App Router on Workers via vinext
│   │   ├── app/                # Route handlers, server components, layouts
│   │   ├── wrangler.jsonc      # Storefront edge bindings (D1, R2, Turnstile)
│   │   └── vite.config.ts      # vinext configuration
│   └── operations-worker/      # Background queue, email, and cron worker
│       ├── src/                # Queue consumer & scheduled cron handlers
│       └── wrangler.jsonc      # Queue & email sending bindings
├── packages/
│   ├── domain/                 # BOM calculation, kit recipes, mystery boxes
│   ├── db/                     # D1 client, schema definitions, movement ledger
│   ├── ui/                     # Radix UI + Tailwind design tokens
│   ├── email/                  # Transactional email templates (React Email/HTML)
│   └── integrations/           # Stripe SDK wrapper & webhook verifier
├── migrations/                 # D1 SQL migrations (0001_init.sql ...)
└── docs/                       # Architecture records & operational guides
```

---

## 5. Review & Acceptance Sign-off

- **Author:** Jim (Cloudflare Solutions Architect) — *Verified against local D1 and Web Crypto runtime spike.*
- **Reviewer:** Dwight (Security & Privacy Lead) — *Verified trust boundaries, Turnstile integration, and session cryptography.*
- **Reviewer:** Toby (Independent QA Certifier) — *Verified atomic D1 rollback test evidence and webhook replay resistance.*
- **Manager:** Michael (god) — *Approved for Phase 1 repo initialization (`BCF-6`).*
