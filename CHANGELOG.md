# Changelog

All notable changes to the BeadsILY direct-to-consumer platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-10-06

### Cloudflare Edge Live Deployment & Production Infrastructure
*Live deployment verified on Cloudflare Workers edge runtime with D1 relational database and R2 object storage bindings.*

#### Added
- **Cloudflare Edge Live Deployment:**
  - Implemented edge Worker runtime in [`apps/storefront/src/worker.ts`](file:///C:/repositories/beadsily-com/apps/storefront/src/worker.ts) using standard Cloudflare Workers `ExportedHandler<Env>`.
  - Configured [`apps/storefront/wrangler.jsonc`](file:///C:/repositories/beadsily-com/apps/storefront/wrangler.jsonc) with Cloudflare D1 database binding (`beadsily-production-d1`, UUID: `9909a98e-0214-4473-a782-a5f736c28f6a`) and Cloudflare R2 media storage binding (`beadsily-media-prod`).
  - Added monorepo esbuild path aliases in `wrangler.jsonc` resolving `@beadsily/db` and `@beadsily/payments` workspace packages cleanly at bundle time.
  - Deployed worker to production edge URL: [`https://beadsily-storefront.razoraz.workers.dev`](https://beadsily-storefront.razoraz.workers.dev).
  - Verified edge health probe: `GET /health` returning status `healthy`, version `1.1.0`, runtime `cloudflare-workers-edge`, and active D1/R2 connectivity.
  - Verified live D1 inventory queries: `GET /api/mystery/catalog` returning all 3 tiers with live stock availability directly from production D1.
- **Production Database & Storage Provisioning:**
  - Provisioned Cloudflare D1 relational database `beadsily-production-d1` (Account: `29e8d505f034256217139dc5c5b731c2`).
  - Remotely executed schema migrations `0001_initial_schema.sql` and `0002_seed_launch_inventory.sql`, verifying 42 physical component SKUs, safety stock constraints, and launch BOM definitions.
  - Provisioned Cloudflare R2 media bucket `beadsily-media-prod` with standard storage class.

---

## [1.0.0] - 2026-10-06

### Initial Production Release Candidate (Certified for Launch)
*Independent Release Certification approved unconditionally by Toby (`toby-muwie8nd`). Master test runner passes 163 / 163 tests across 54 test suites in 2.28s (0 failures, 0 skipped).*

#### Added
- **Core Edge Architecture & Scaffolding (`BCF-1`, `BCF-2`, `BCF-6`):**
  - Integrated Next.js on Cloudflare Workers edge using the `vinext` runtime adapter.
  - Authored Architecture Decision Records: [`ADR-001`](file:///C:/repositories/beadsily-com/docs/architecture/ADR-001-PLATFORM-TOPOLOGY.md) (Platform Topology), [`ADR-002`](file:///C:/repositories/beadsily-com/docs/architecture/ADR-002-NEXT-RUNTIME-SPIKE.md) (Edge Next.js compatibility spike), and [`ADR-003`](file:///C:/repositories/beadsily-com/docs/architecture/ADR-003-PAYMENTS-AND-SUBSCRIPTIONS.md) (Payments & Subscriptions).
  - Scaffolded monorepo workspaces: `apps/storefront`, `packages/db`, `packages/ui`, `packages/auth`, `packages/payments`, and `packages/email`.

- **Physical Inventory Model & Launch BOMs (`BCF-3`):**
  - Created intake registry of 35+ verified physical component SKUs in [`INVENTORY-INTAKE.csv`](file:///C:/repositories/beadsily-com/docs/inventory/INVENTORY-INTAKE.csv).
  - Defined launch Bills of Materials (BOMs) for 7 launch products, establishing exact itemized counts and hardware spares buffers.

- **Relational D1 Database & Atomic Stock Engine (`BCF-7`):**
  - Created SQL migrations: `0001_initial_schema.sql` (components, kits, kit_components, orders, order_items, mystery_boxes, mystery_units, inventory_movements) and `0002_seed_launch_inventory.sql`.
  - Implemented `@beadsily/db` multi-component atomic BOM reservation engine (`packages/db/src/inventory.mjs`).
  - Added SQLite database trigger `trg_components_prevent_oversell` and `CHECK ((stock_on_hand - stock_reserved - safety_stock) >= 0)` constraints, guaranteeing atomic transaction abort and zero-row rollback on short inventory (`INV-01`, `INV-02`).
  - Implemented immutable audit ledger tracking every allocation, consumption, restock, and return (`INV-04`).

- **Storefront UI Primitives & Design Tokens (`BCF-8`):**
  - Delivered accessible component library in `@beadsily/ui` (`Button`, `Badge`, `ProductCard`, `QuantitySelector`, `HeroBanner`, `Accordion`).
  - Enforced WCAG 2.2 AA mathematical contrast rules: Primary CTA (`bg-pink-500` with `text-charcoal-950`) achieves **6.72:1** contrast; standalone white text on pink-500 strictly prohibited (fails at 2.72:1) (`UI-01`, `UI-02`).
  - Enforced minimum 44px mobile touch targets across all steppers and buttons (`UI-07`).

- **Cybersecurity, Edge Turnstile & Auth (`BCF-4`, `BCF-9`):**
  - Authored system threat model and trust boundary specifications ([`THREAT-MODEL.md`](file:///C:/repositories/beadsily-com/docs/security/THREAT-MODEL.md)).
  - Implemented `@beadsily/auth` using zero-dependency Web Crypto API HMAC-SHA256, `__Host-` partitioned session cookies, single-use Cloudflare Turnstile token validation with anti-replay tracking (`SEC-01`), and origin CSRF protection (`SEC-02`).
  - 43 automated security tests passing.

- **Automated Acceptance Test Harness (`BCF-10`):**
  - Established unified master test runner in [`tests/run-all-acceptance-tests.mjs`](file:///C:/repositories/beadsily-com/tests/run-all-acceptance-tests.mjs) executing tests across all 12 domains of `missions/ACCEPTANCE-MATRIX.md`.

- **Responsive 15-Guest Kit Configurator (`BCF-11`):**
  - Built interactive `KitConfigurator` (`apps/storefront/src/components/KitConfigurator.tsx`) calculating base 15-guest kits ($189.00 for 45 items; $12.60/guest) and dynamic add-on guests (+$12.00 / +3 items per guest up to 30 guests / 90 items). Sub-15 orders are rejected at the API boundary (`CAT-01`).
  - Published dedicated catalog routes: `/party-kits` (with theme switcher for *Taylor's Era*, *Desert Bloom*, *Glow & Neon Daisy*, and *Mermaid Cove*) and `/mystery-boxes`.

- **Stripe Embedded Checkout & Payment Integration (`BCF-12`):**
  - Delivered `@beadsily/payments` integrating Stripe Embedded Checkout Element (`<EmbeddedCheckoutProvider>`).
  - Enforced server-derived pricing lookup on Cloudflare Workers; rejected client-submitted price tampering (`PAY-01`).
  - Implemented webhook HMAC signature verification with duplicate replay deduplication (`PAY-03`, `PAY-04`).
  - Added customer session isolation defending against IDOR (`PAY-05`).
  - Added auto-release of reserved inventory upon checkout session expiration (`INV-06`).

- **Curated Mystery Box Allocation Engine (`BCF-13`):**
  - Delivered `packages/db/src/mystery.mjs` and storefront API routes (`/api/mystery/catalog`, `/allocate`, `/return-audit`).
  - Enforced guaranteed project counts: *Mystery Maker* (3 projects, $28.00) and *Bestie Duo* (6 projects, $48.00) (`MYS-01`).
  - Prepacked sealed units consume raw components once at packout (`MYS-02`).
  - Idempotent repeat calls return the identical allocated unit without rerolling (`MYS-03`).
  - Guaranteed zero recurring billing on mystery purchases (`MYS-05`).
  - Damaged returns triage audits returned components against the immutable lot contents snapshot (`MYS-06`).

- **Transactional Email Sending & D1 Outbox Queues (`BCF-14`):**
  - Delivered `@beadsily/email` with Dual-MIME templates (`order_confirmation`, `order_shipped`, `monthly_drop`, `stock_alert`, `replacement_dispatched`).
  - Implemented Cloudflare sender adapter with visible configuration error reporting (`EMAIL-01`).
  - Implemented D1 outbox queue handlers with bounded exponential backoff retries and dead-letter queue escalation (`EMAIL-02`).
  - Decoupled email sending from payment/order state; order remains paid even if email delivery fails (`EMAIL-03`).
  - Added inbound support email security sanitizer quarantining dangerous attachments and stripping script tags (`EMAIL-04`).

- **Technical SEO, Product Schemas & Canonical Redirects (`BCF-15`):**
  - Implemented Schema.org Product, Offer, Organization, and FAQPage JSON-LD structured data with minor-unit USD pricing and real-time stock availability (`SEO-01`, `SEO-04`).
  - Built Cloudflare edge canonical redirect middleware intercepting requests and returning 301 permanent redirects to apex `https://beadsily.com`, while stripping marketing/tracking query parameters (`SEO-02`, `SEO-03`).

- **Host Usability Protocol & Assembly Verification (`BCF-16`):**
  - Authored Master Host Guide, Guest Step-by-Step Cards, and Support FAQs.
  - Executed physical novice usability trial (`KIT-01`) verified at 32m 30s unassisted completion.

- **School Festival Booth Operations & POS Reconciliation (`BCF-17`):**
  - Authored Santa Fe Elementary Fall Festival operational manual ([`BOOTH-OPERATIONS-AND-RECONCILIATION.md`](file:///C:/repositories/beadsily-com/docs/event/BOOTH-OPERATIONS-AND-RECONCILIATION.md)).
  - Created 28-transaction offline sales fixture ($267.99 across cash and card).
  - Built D1 reconciliation engine (`packages/db/src/booth.mjs`), proving 100% idempotent post-event sync with zero stock double-counting (`EVENT-01`, `EVENT-02`).

- **Independent End-to-End Release Certification (`BCF-18`):**
  - Audited all 12 domains in [`docs/qa/RELEASE-CERTIFICATION-REPORT.md`](file:///C:/repositories/beadsily-com/docs/qa/RELEASE-CERTIFICATION-REPORT.md), resulting in **Unconditional Release Approval**.

- **Production Deployment & Operations Runbook:**
  - Published comprehensive deployment and disaster recovery SOP in [`docs/ops/PRODUCTION-DEPLOYMENT-AND-OPERATIONS-RUNBOOK.md`](file:///C:/repositories/beadsily-com/docs/ops/PRODUCTION-DEPLOYMENT-AND-OPERATIONS-RUNBOOK.md).

- **Owner Decisions Record (`BCF-5`):**
  - Recorded formal sign-offs from Korry Nelson in [`docs/brand/OWNER-DECISIONS-RECORD.md`](file:///C:/repositories/beadsily-com/docs/brand/OWNER-DECISIONS-RECORD.md).

---

## Versioning Policy for Future Pushes

Every subsequent commit or push to `main` must follow this semantic versioning discipline:
1. **Patch Updates (`1.0.X`):** Bug fixes, copy revisions, visual styling adjustments, documentation improvements, or dependency patches.
2. **Minor Updates (`1.X.0`):** New theme releases, new craft kit SKUs, nationwide shipping calculation integrations, or non-breaking API additions.
3. **Major Updates (`X.0.0`):** Breaking relational schema changes, major checkout flow overhauls, or breaking payment webhook architecture updates.
4. **Changelog Entry:** Every release must append a dated section to this file detailing added, changed, deprecated, removed, fixed, or security items.
