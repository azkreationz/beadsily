# Independent QA Review: ADR-001 & INVENTORY-MODEL

**Reviewer:** Toby (`toby-muwie8nd`), Independent QA & Compliance Certifier  
**Target Specifications:** 
- `docs/architecture/ADR-001-PLATFORM-TOPOLOGY.md` (by Jim & Michael)
- `docs/inventory/INVENTORY-MODEL.md` (by Pam & Oscar)  
**Date:** October 6, 2026  
**Status:** CONDITIONAL APPROVAL with Critical QA Findings  
**Matrix Impact:** `INV-01`, `INV-02`, `INV-06`, `PAY-03`, `PAY-04`, `OPS-02`

---

## Executive Summary

The overall architecture (Next.js on Cloudflare Workers, D1 relational ledger, R2 object storage, Stripe Elements, prepacked mystery units) provides a sound foundation. However, from an independent verification and testability perspective, there is **one critical SQLite/D1 runtime nuance** regarding atomic batch reservations that MUST be designed into the schema and queries prior to Phase 1 implementation.

---

## 1. Critical Finding: D1 Batch Semantics on Zero-Row UPDATEs (INV-01, INV-02)

### The Issue
In `docs/inventory/INVENTORY-MODEL.md` Section 4, the proposed reservation query is:
```sql
UPDATE components 
SET stock_reserved = stock_reserved + :qty_needed,
    updated_at = :now
WHERE id = :component_id 
  AND (stock_on_hand - stock_reserved - safety_stock) >= :qty_needed;
```
And the text notes:
> If `changes() == 0` (zero rows updated), the component is short. Roll back all prior component updates in this batch immediately!

**Runtime Reality in Cloudflare D1:**
1. Cloudflare D1 does not support interactive transactions (`BEGIN TRANSACTION ... COMMIT`) across multiple separate application turns over HTTP.
2. D1 provides atomic batching via `env.DB.batch([stmt1, stmt2, ...])`.
3. In SQLite, if an `UPDATE ... WHERE ...` statement matches 0 rows, SQLite considers the statement **successful** (`changes == 0`, error = null). Therefore, `DB.batch()` will NOT automatically abort or roll back remaining statements!
4. If a 15-guest kit reservation consists of 8 component updates in a `batch()`, and Component 3 has insufficient stock (matching 0 rows), SQLite will proceed to update Components 4 through 8 unless the batch fails!

### Recommended Solutions (Choose One or Both)

#### Option A (Recommended Schema Constraint): SQL CHECK Constraint
Add a check constraint directly to the `components` table in D1:
```sql
ALTER TABLE components ADD CONSTRAINT chk_stock_available 
  CHECK (stock_reserved >= 0 AND (stock_on_hand - stock_reserved - safety_stock) >= 0);
```
Or in the `CREATE TABLE` definition:
```sql
CREATE TABLE components (
  id TEXT PRIMARY KEY,
  ...
  stock_on_hand INTEGER NOT NULL DEFAULT 0,
  stock_reserved INTEGER NOT NULL DEFAULT 0,
  safety_stock INTEGER NOT NULL DEFAULT 0,
  ...
  CHECK (stock_reserved >= 0),
  CHECK ((stock_on_hand - stock_reserved - safety_stock) >= 0)
);
```
**Why this works:**
With this CHECK constraint, the reservation statement can simply be:
```sql
UPDATE components 
SET stock_reserved = stock_reserved + :qty_needed,
    updated_at = :now
WHERE id = :component_id;
```
If `:qty_needed` would cause `stock_reserved` to exceed `stock_on_hand - safety_stock`, SQLite **fails with `SQLITE_CONSTRAINT_CHECK`**.
In Cloudflare D1, any statement failure inside `DB.batch()` **automatically rolls back the entire batch**! This turns a soft application-level zero-row check into an ironclad database-enforced atomicity guarantee.

#### Option B: Post-Batch Inspection & Compensation
If using `WHERE` clauses without CHECK constraints, the application layer must inspect `results.every(r => r.meta.changes === 1)`. If any statement had `changes === 0`, an immediate compensating transaction must be executed. 
*QA Assessment:* Option B is prone to race conditions and worker crashes between execution and compensation. **Option A is strictly required for PASS certification under INV-01 and INV-02.**

---

## 2. Webhook Replay & Idempotency Storage (PAY-03, PAY-04)

In ADR-001, webhook signature verification is mandated. 
To pass `PAY-03` and `PAY-04`:
1. Angela must include a dedicated `stripe_events` or `webhook_events` table in the D1 schema:
   ```sql
   CREATE TABLE webhook_events (
     event_id TEXT PRIMARY KEY,
     event_type TEXT NOT NULL,
     payload_hash TEXT NOT NULL,
     status TEXT NOT NULL CHECK (status IN ('received', 'processed', 'failed')),
     created_at INTEGER NOT NULL,
     processed_at INTEGER
   );
   ```
2. When a webhook arrives:
   - Insert `event_id` into `webhook_events` (or use `INSERT ... ON CONFLICT DO NOTHING`).
   - If the event was already processed, return `200 OK` immediately without re-triggering stock transitions, email sends, or fulfillment orders.
   - If processing fails partway through, the record tracks `failed` status for operational reconciliation.

---

## 3. Mystery Box Prepack Ledger Invariant (MYS-01..03, INV-05)

The decision to treat mystery boxes as prepacked sealed units rather than runtime random rollouts is **STRONGLY APPROVED**.
Key verification requirements:
1. Assembly lot deduction: `assembly_consume` on components and `assembly_produce` on finished sealed box sku MUST occur in a single `DB.batch()` transaction.
2. Checkout reservation locks the sealed box unit (e.g. SKU `MYS-MKR-01`), not components.
3. Webhook retries must retain the same allocated sealed unit without rerolling variants (satisfies `MYS-03`).

---

## 4. Testability & Harness Readiness (BCF-10)

For `BCF-10`, Toby will establish:
1. Vitest test runner paired with `@cloudflare/vitest-pool-workers` / Miniflare to execute tests directly against Cloudflare Workers runtime (workerd).
2. Synthetic D1 test harness running migrations in an isolated in-memory environment per test suite.
3. Concurrency test runner simulating simultaneous buyers racing for identical stock (INV-01).

---

## Conclusion & Action Items
- [ ] Jim: Incorporate Option A (`CHECK` constraint) into `ADR-001` Section 4.
- [ ] Oscar: Include `CHECK ((stock_on_hand - stock_reserved - safety_stock) >= 0)` in initial D1 migration for `components`.
- [ ] Angela: Include `webhook_events` table in payments schema draft for idempotency proof.
