# Production Deployment & Operations Runbook: BeadsILY Platform

**Governing Documents:**
- [`MISSION-BEADSILY-COMMERCE.md`](file:///C:/repositories/beadsily-com-floor/missions/MISSION-BEADSILY-COMMERCE.md) (v1.1.0)
- [`docs/qa/RELEASE-CERTIFICATION-REPORT.md`](file:///C:/repositories/beadsily-com/docs/qa/RELEASE-CERTIFICATION-REPORT.md)
**Target Milestone:** Santa Fe Elementary Fall Festival (Friday, Oct 23, 2026, 5–8 p.m. America/Phoenix) & Nationwide Launch  
**Repository:** `C:\repositories\beadsily-com`

---

## 1. Overview & Operational Architecture

The BeadsILY platform runs on Cloudflare Edge with server-derived pricing, atomic multi-component inventory reservations in Cloudflare D1, media assets in Cloudflare R2, Stripe Embedded Checkout, and transactional email queuing with dead-letter monitoring.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BEADSILY EDGE ARCHITECTURE                            │
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

---

## 2. Pre-Deployment Provisioning Checklist

### A. Cloudflare Resources
1. **Cloudflare Account & Workers Paid Plan:**
   - Active Cloudflare account with Workers Paid enabled for CPU limits and D1 scale.
2. **Cloudflare D1 Database Provisioning:**
   ```bash
   wrangler d1 create beadsily-production-d1
   ```
   Note the `database_name` and `database_id` generated. Update `apps/storefront/wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "beadsily-production-d1"
   database_id = "<YOUR_PROD_D1_ID>"
   ```
3. **Execute Production Schema & Seed Migrations:**
   ```bash
   wrangler d1 migrations apply beadsily-production-d1 --remote
   ```
   *Verifies:*
   - `0001_initial_schema.sql`: Tables `components`, `kits`, `kit_components`, `orders`, `order_items`, `mystery_boxes`, `mystery_units`, `inventory_movements`, triggers, and indexes.
   - `0002_seed_launch_inventory.sql`: 35+ intake SKUs, 7 launch kit BOMs, and sealed mystery units.

4. **Cloudflare R2 Storage Bucket:**
   ```bash
   wrangler r2 bucket create beadsily-media-prod
   ```
   Configure public custom domain or CDN caching for photography and vector assets (`assets.beadsily.com`).

5. **Cloudflare Turnstile Widget:**
   - Create Turnstile site in Cloudflare dashboard for `beadsily.com`.
   - Set mode to "Managed".
   - Record `TURNSTILE_SITE_KEY` (public) and `TURNSTILE_SECRET_KEY` (Worker secret).

---

### B. Stripe Production Credentials & Webhook Setup

1. **API Keys:**
   - Add production keys to Worker environment:
     ```bash
     wrangler secret put STRIPE_SECRET_KEY
     wrangler secret put STRIPE_PUBLISHABLE_KEY
     ```
2. **Webhook Endpoint Registration:**
   - URL: `https://beadsily.com/api/webhooks/stripe`
   - Events subscribed:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
3. **Webhook Signing Secret:**
   - Record `whsec_...` from Stripe dashboard.
   - Add to Worker environment:
     ```bash
     wrangler secret put STRIPE_WEBHOOK_SECRET
     ```

---

## 3. Secret Environment Variables Configuration

Execute the following commands to securely set production worker secrets:

```bash
# Cloudflare Worker Environment Secrets
wrangler secret put SESSION_SECRET          # 64-character random hex string for HMAC session cookies
wrangler secret put TURNSTILE_SECRET_KEY    # Cloudflare Turnstile secret key
wrangler secret put STRIPE_SECRET_KEY       # Stripe live secret key (sk_live_...)
wrangler secret put STRIPE_WEBHOOK_SECRET   # Stripe webhook signing secret (whsec_...)
wrangler secret put EMAIL_API_KEY           # Transactional email provider API key
```

---

## 4. Edge Build & Deployment Procedure

1. **Run Full Automated Master Acceptance Test Suite:**
   ```bash
   node tests/run-all-acceptance-tests.mjs
   ```
   *Requirement:* Must output **163 / 163 tests passing (0 failures)**.

2. **Deploy Application to Cloudflare Workers:**
   ```bash
   cd apps/storefront
   npx wrangler deploy
   ```

3. **Verify Edge Health & Canonical Redirects (`SEO-02`):**
   ```bash
   curl -I https://www.beadsily.com
   # Expected: HTTP/1.1 301 Moved Permanently -> Location: https://beadsily.com/

   curl -I https://beadsilly.com
   # Expected: HTTP/1.1 301 Moved Permanently -> Location: https://beadsily.com/
   ```

---

## 5. Event Operations SOP: Santa Fe Elementary Fall Festival (Oct 23, 2026)

### A. Pre-Event Preparation (5:00 PM Arizona MST / America/Phoenix)
1. Verify physical inventory count matches `docs/event/fixtures/booth-offline-tally-sheet.csv`.
2. Ensure offline paper tally sheets and local tally forms are loaded on booth devices.
3. Configure card reader (Square or Stripe Terminal) for offline transaction buffering or cellular hotspot.
4. Display laminated QR codes linked directly to `https://beadsily.com/party-kits` for adult hosts.

### B. Booth Outage & Offline Procedure (`EVENT-01`)
- In the event of cellular drop, record each physical sale on the offline tally sheet with timestamp, payment method (cash/card), item SKU, quantity, and unit price.
- Do not attempt live database mutations if connectivity is unstable.

### C. Post-Event Reconciliation (`EVENT-02`)
1. Transcribe physical paper sales into JSON format matching `docs/event/fixtures/booth-offline-tally-oct23.json`.
2. Execute the idempotent reconciliation batch handler:
   ```javascript
   import { reconcileBoothSales } from '@beadsily/db/booth';
   const result = await reconcileBoothSales(db, boothBatchData);
   console.log(`Reconciled: ${result.processed} sales, ${result.totalRevenueFormatted}`);
   ```
3. Verify zero discrepancy against warehouse stock on hand. Unsold units remain in available stock.

---

## 6. Disaster Recovery & Backup Rehearsal (`OPS-01`, `OPS-02`)

### A. Database Backup
Cloudflare D1 automatically creates continuous point-in-time backups. In addition, an explicit snapshot should be triggered before large inventory intake or major event synchronizations:
```bash
wrangler d1 export beadsily-production-d1 --output=./backups/d1-backup-$(date +%Y%m%d%H%M%S).sql
```

### B. Database Restore Verification (`OPS-02`)
1. Restore to a dedicated sandbox database:
   ```bash
   wrangler d1 execute beadsily-staging-d1 --file=./backups/d1-backup-<timestamp>.sql
   ```
2. Verify table integrity and row counts:
   ```sql
   SELECT COUNT(*) FROM components;
   SELECT COUNT(*) FROM inventory_movements;
   ```
3. Run `tests/run-all-acceptance-tests.mjs` against staging environment.

---

## 7. Operational Contacts & Escalation Matrix

| Role | Contact | Primary Responsibility |
| :--- | :--- | :--- |
| **Owner & Executive Decisions** | Korry Nelson | Live domain DNS, Canva ID, booth reader, production credentials |
| **Engineering Orchestrator** | Michael (`god`) | Floor orchestration, cross-specialist coordination, Slack bridge |
| **Lead QA & Certifier** | Toby (`toby-muwie8nd`) | Acceptance matrix verification, release gating |
| **Security & Privacy** | Dwight (`dwight-muwid4p3`) | Turnstile, threat model, CSRF/RBAC audits |
| **Backend & Inventory** | Oscar (`oscar-muwid2fm`) | D1 database, stock allocations, email queues |
| **Event Lead** | Pam (`pam-muwic8fg`) | School booth operations, inventory intake, physical tallies |
| **UX & Storefront** | Erin (`erin-muwidjtc`) | Responsive UI, kit configurator, accessibility |
