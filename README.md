# BeadsILY Direct-to-Consumer Commerce Platform

[![Release Version](https://img.shields.io/badge/version-1.2.5-pink.svg)](./package.json)
[![Acceptance Tests](https://img.shields.io/badge/tests-163%2F163%20passing-brightgreen.svg)](./tests/run-all-acceptance-tests.mjs)
[![Accessibility](https://img.shields.io/badge/accessibility-WCAG%202.2%20AA%20Certified-blue.svg)](./packages/ui/src/tokens/colors.ts)
[![Security Audited](https://img.shields.io/badge/security-Dwight%20Certified%20(43%2F43%20tests)-orange.svg)](./packages/auth/)
[![Gating Verdict](https://img.shields.io/badge/release%20gating-UNCONDITIONAL%20APPROVAL-success.svg)](./docs/qa/RELEASE-CERTIFICATION-REPORT.md)

**Target Soft Launch:** Santa Fe Elementary Fall Festival, Friday October 23, 2026, 5–8 p.m. America/Phoenix  
**Corporate Entity:** BeadsILY (a business unit of Nelsons US LLC)  
**Primary Canonical Host:** [`https://beadsily.com`](https://beadsily.com) (with 301 permanent redirects for `beadsilly.com` and `www.beadsily.com`)  
**Live Edge Deployment:** [`https://beadsily.com`](https://beadsily.com) / [`https://beadsily-storefront.razoraz.workers.dev`](https://beadsily-storefront.razoraz.workers.dev)  
**Architecture Topology:** Cloudflare Workers Edge (`apps/storefront`) + Cloudflare D1 Relational DB (`beadsily-production-d1`) + Cloudflare R2 Media (`beadsily-media-prod`) + Stripe Embedded Checkout  

---

## 1. Executive Summary & Value Proposition

BeadsILY is an accessible direct-to-consumer craft commerce platform designed to deliver premium, tactile jewelry and keepsake crafting experiences. The platform solves the chronic pain points of children's and adult party craft kits: cheap disposable plastic, missing components, tangled cords, and stressful host preparation.

### Flagship Offerings

1. **The 15-Guest 45-Keepsake Party Kit (`CAT-01`, `CAT-02`, `UI-06`):**
   - **Guaranteed Output:** Every base kit guarantees 15 guests each make exactly 3 finished keepsakes (1 beadable metallic ballpoint pen, 1 swivel carabiner keychain charm, and 1 elastic stretch bracelet) = **45 finished keepsakes** per box.
   - **Transparent Dynamic Pricing:** Base 15-guest kit priced at **$189.00** ($12.60 per guest). Dynamic guest scaling allows hosts to add guests at **+$12.00 / +3 items** per extra guest up to 30 guests ($369.00 / 90 items). Sub-15 orders are rejected at the API boundary.
   - **Built-in Spares Buffer:** Every kit packs extra hardware (+1 pen, +1 keychain, +3 pre-cut stretch cords, +3 theme focals, +25 round accents, +5 rhinestone spacers, and 60 pooled alphabet beads).
   - **Four Launch Themes:** *Taylor's Era*, *Desert Bloom*, *Glow & Neon Daisy*, and *Mermaid Cove*.

2. **Curated Mystery Craft Boxes (`MYS-01`..`MYS-06`):**
   - **Zero Virtual Loot / Gambling:** Unlike deceptive digital loot mechanics, BeadsILY mystery craft boxes are **physical, prepacked sealed inventory units** with disclosed guaranteed project counts.
   - **Tiers:** *Mystery Maker* (3 projects, $28.00) and *Bestie Duo* (6 projects, $48.00).
   - **Idempotent Allocation:** Retried checkouts allocate the exact same prepacked unit without rerolling.
   - **Zero Recurring Surprises:** Strictly one-time purchases with zero unexpected subscription rebilling.

3. **Festival Booth Offline Operations (`EVENT-01`, `EVENT-02`):**
   - Field-tested operations protocol for the Santa Fe Elementary Fall Festival.
   - Supports in-person Stripe Terminal card reader with mobile tap-to-pay fallback.
   - Complete offline paper tally sheet protocol and post-event idempotent batch sync (`@beadsily/db/booth`) reconciling physical cash/card sales with zero stock variance.

---

## 2. Architecture & Edge Topology

The BeadsILY platform runs natively on Cloudflare Edge with serverless execution, zero-egress media storage, and relational SQLite consistency:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BEADSILY EDGE TOPOLOGY                                │
│                                                                                 │
│   Incoming Requests ──► Cloudflare Edge (Wrangler / Next.js via vinext)         │
│                              │                                                  │
│       ┌──────────────────────┼───────────────────────┐                          │
│       ▼                      ▼                       ▼                          │
│   SEO Redirects        Auth & Turnstile      Storefront & APIs                  │
│   (Apex beadsily.com)  (HMAC Session)        (/party-kits, /mystery-boxes)      │
│                              │                       │                          │
│                              └───────────┬───────────┘                          │
│                                          ▼                                      │
│                                Cloudflare D1 Database                           │
│                          (Atomic Reservations & Triggers)                       │
│                                          │                                      │
│                      ┌───────────────────┴───────────────────┐                  │
│                      ▼                                       ▼                  │
│             Stripe Embedded APIs                     Transactional Outbox       │
│             (Webhooks + Deduplication)               (Retries + DLQ)            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

- **Runtime:** Next.js on Cloudflare Workers edge (`vinext` adapter).
- **Database:** Cloudflare D1 (relational SQLite). Enforces multi-component atomic BOM reservations and trigger-enforced rollbacks on partial shortages (`INV-01`, `INV-02`).
- **Media Assets:** Cloudflare R2 bucket (`beadsily-media-prod`) for high-resolution vectors, photos, and printables.
- **Payments:** Stripe Embedded Checkout Element (`client_secret`), server-derived pricing (`PAY-01`), and webhook HMAC signature validation with replay defense (`PAY-03`, `PAY-04`).
- **Security:** Single-use Cloudflare Turnstile token validation (`SEC-01`), origin CSRF verification, and `__Host-` partitioned session cookies.
- **Email:** Decoupled D1 outbox queue handlers (`@beadsily/email`) with bounded exponential retries and dead-letter queue (`EMAIL-02`).

---

## 3. Monorepo Structure

```
beadsily/
├── apps/
│   └── storefront/              # Next.js mobile-first accessible storefront & edge API routes
│       ├── src/app/             # App router (/party-kits, /mystery-boxes, /checkout)
│       ├── src/components/      # KitConfigurator, UI integrations
│       ├── src/middleware.ts    # Edge canonical redirects & Turnstile guards
│       └── wrangler.toml        # Cloudflare Workers deployment configuration
├── packages/
│   ├── auth/                    # Zero-dependency Web Crypto HMAC session auth & Turnstile guards
│   ├── db/                      # D1 relational schemas, atomic inventory engine, mystery allocator
│   ├── email/                   # Dual-MIME templates, Cloudflare sender adapter, outbox queues
│   ├── payments/                # Stripe Embedded Checkout SDK, pricing math, webhook FSM
│   └── ui/                      # Accessible design tokens, WCAG 2.2 AA primitives, Tailwind preset
├── migrations/
│   ├── 0001_initial_schema.sql  # Relational tables, triggers, constraints, and audit ledger
│   └── 0002_seed_launch_inventory.sql # 35+ verified SKUs, 7 launch kit BOMs, sealed mystery units
├── docs/                        # Architecture ADRs, threat models, SOPs, QA certification
│   ├── architecture/            # ADR-001 (Topology), ADR-002 (Next runtime), ADR-003 (Payments)
│   ├── brand/                   # Asset manifests, contrast verification, owner decisions record
│   ├── event/                   # Santa Fe Elementary booth SOP & offline sales fixtures
│   ├── ops/                     # Production deployment and operations runbook
│   └── qa/                      # Independent Release Certification Report (100% Certified)
├── tests/
│   ├── run-all-acceptance-tests.mjs # Master test runner executing 163 tests across 54 suites
│   ├── atomic-reservation.test.mjs  # Multi-component concurrency & rollback tests
│   ├── checkout-session.test.mjs    # Stripe checkout & pricing tamper defense tests
│   ├── email.test.mjs               # Outbox retry, bounded escalation & dual-MIME tests
│   ├── event-booth.test.mjs         # 28-transaction booth rehearsal & idempotent sync tests
│   ├── mystery-box.test.mjs         # Sealed unit allocation & damaged return tests
│   ├── security.test.mjs            # Dwight's 43-test cybersecurity harness
│   ├── seo.test.mjs                 # JSON-LD Product/Offer schemas & 301 canonical tests
│   └── ui.test.mjs                  # WCAG 2.2 AA mathematical contrast & touch target tests
├── CHANGELOG.md                 # Semantic versioning release history
└── package.json                 # Monorepo workspaces and automated test commands
```

---

## 4. Key Acceptance Invariants (`missions/ACCEPTANCE-MATRIX.md`)

The platform is certified against all 12 core acceptance domains:

| Domain | Key Invariants Covered | Certification State |
| :--- | :--- | :---: |
| **1. Catalog & BOM** | `CAT-01` (15-Guest 45-keepsake guarantee), `CAT-02` (Spares buffer), `CAT-03` (Server price calculation) | **100% Certified** |
| **2. Inventory & D1** | `INV-01` (Atomic multi-component BOM reservation), `INV-02` (Zero-row rollback on shortage), `INV-03` (Idempotent lock), `INV-04` (Audit ledger) | **100% Certified** |
| **3. Payments & Stripe**| `PAY-01` (Tamper-proof server pricing), `PAY-02` (Embedded Element), `PAY-03/04` (Webhook HMAC & replay defense), `PAY-05` (Customer IDOR isolation) | **100% Certified** |
| **4. Mystery Boxes** | `MYS-01` (Disclosed project counts), `MYS-02` (Sealed-unit packout consumption), `MYS-03` (Idempotent retry without reroll), `MYS-05` (Zero recurring billing) | **100% Certified** |
| **5. Subscriptions** | `SUB-01..06` (Monthly cutoff state machine, America/Phoenix billing dates, paid-cycle fulfillment tracking) | **100% Certified** |
| **6. Email & Outbox** | `EMAIL-01` (Visible CF error logging), `EMAIL-02` (Bounded retries & DLQ), `EMAIL-03` (Decoupled order state), `EMAIL-04` (Inbound sanitization) | **100% Certified** |
| **7. Technical SEO** | `SEO-01` (Product/Offer JSON-LD structured data), `SEO-02` (Edge 301 canonical redirects to apex `beadsily.com`), `SEO-04` (Organization & FAQPage schemas) | **100% Certified** |
| **8. Event Operations**| `EVENT-01` (Festival offline cash/card sales protocol), `EVENT-02` (Idempotent reconciliation batch with zero stock variance) | **100% Certified** |
| **9. Host Usability** | `KIT-01` (Novice adult usability protocol verified at 32m 30s unassisted completion; full guide under 90 minutes) | **100% Certified** |
| **10. Storefront UI** | `UI-01..07` (WCAG 2.2 AA contrast compliance; minimum 44px mobile touch targets; dynamic configurator) | **100% Certified** |
| **11. Security Audit** | `SEC-01..03` (Cloudflare Turnstile token verification, replay defense, CSRF origin checking, `__Host-` cookies) | **100% Certified** |
| **12. Operations Runbook**| `OPS-01/02` (Disaster recovery runbook, point-in-time D1 exports, incident triage) | **100% Certified** |

### Critical Design Rule: WCAG 2.2 AA Contrast Compliance
The primary brand CTA pairs `bg-pink-500` (`#FF689D`) with `text-charcoal-950` (`#171416`), achieving a contrast ratio of **6.72:1** (satisfies WCAG AA Normal Text and AAA Large Text). Standalone white text on `pink-500` fails at **2.72:1** and is strictly prohibited in code, design tokens, and CI tests.

---

## 5. Quick Start & Testing

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- Cloudflare Wrangler CLI (`npm install -g wrangler`)

### Running the Master Acceptance Test Suite
Execute all 163 tests across 54 suites covering all 12 domains:
```bash
npm test
# or directly:
node tests/run-all-acceptance-tests.mjs
```
*Expected Output:* **163 passing, 0 failures, ~2.3s execution time**.

### Local Storefront Development
```bash
cd apps/storefront
npm run dev
```
Navigate to `http://localhost:3000` to view the interactive 15-Guest Kit Configurator, launch catalog routes (`/party-kits`, `/mystery-boxes`), and checkout flows.

---

## 6. Deployment Procedure

Refer to the complete runbook in [`docs/ops/PRODUCTION-DEPLOYMENT-AND-OPERATIONS-RUNBOOK.md`](./docs/ops/PRODUCTION-DEPLOYMENT-AND-OPERATIONS-RUNBOOK.md).

```bash
# 1. Apply D1 schema and seed migrations
wrangler d1 migrations apply beadsily-production-d1 --remote

# 2. Deploy edge storefront to Cloudflare Workers
cd apps/storefront
npx wrangler deploy
```

---

## 7. Versioning Policy & Push Protocol

BeadsILY adheres strictly to [Semantic Versioning 2.0.0](https://semver.org/):
- **MAJOR** (`X.0.0`): Breaking changes to relational schemas, API routes, or payment invariants.
- **MINOR** (`1.X.0`): New product catalog additions, new theme releases, or feature enhancements.
- **PATCH** (`1.0.X`): Bug fixes, copy edits, security patches, or performance optimizations.

**Standing Rule:** Every push to `main` must bump the version appropriately across the root and workspace `package.json` files and append entries to [`CHANGELOG.md`](./CHANGELOG.md).

---

## 8. Governance & Team Contacts

- **Corporate Entity:** BeadsILY (a business unit of Nelsons US LLC)
- **Executive Owner:** Korry Nelson
- **Architecture & Coordination:** Michael (`god`), BeadsILY Office Manager
- **Independent QA Certifier:** Toby (`toby-muwie8nd`), Compliance Lead
- **Security & Authorization:** Dwight (`dwight-muwicook`), Security Lead
- **Product & Operations:** Pam (`pam-muwic8fg`), Physical Fulfillment Lead
