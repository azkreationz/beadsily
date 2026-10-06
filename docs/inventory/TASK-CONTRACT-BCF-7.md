# BeadsILY Task Contract: BCF-7

- **Task ID / phase:** `BCF-7` / Phase 1: Foundation Build
- **Title:** Phase 1: D1 Relational Schema Migrations & Atomic Stock Reservation
- **Business trigger and resulting behavior:** Build and verify the complete Cloudflare D1 relational database schema, seed verified inventory data from BCF-3, implement atomic all-or-nothing multi-component kit reservation algorithms with zero-row rollback handling, and provide automated test suites proving INV-01 through INV-06 and MYS-01 through MYS-03 compliance.
- **Accountable implementer:** Oscar (`oscar-muwid2fm`, Backend Data & Inventory Engineer)
- **Independent reviewer(s):** Toby (`toby-muwie8nd`, Independent QA Certifier), Jim (`jim-muwibr7y`, Cloudflare Solutions Architect)
- **BeadsILY repository / branch / workspace:**
  - Primary Repository: `C:\repositories\beadsily-com`
  - Active Worktree: `C:\repositories\beadsily-com-floor\worktrees\oscar-muwid2fm`
  - Active Branch: `agent/oscar-muwid2fm`
- **Allowed paths / assets / resources:**
  - `worktrees/oscar-muwid2fm/migrations/*`
  - `worktrees/oscar-muwid2fm/packages/db/*`
  - `worktrees/oscar-muwid2fm/docs/inventory/*`
  - `docs/inventory/*` (shared floor copy)
  - `hive/tasks.json` (kanban status updates)
  - `hive/agents/oscar-muwid2fm/memory.md` (durable memory log)
- **Read-only source repositories and pinned snapshots:**
  - `turbodepot` (ListMint): `bd1704c690607cf32972f0ed8eed42897c0d583e`
  - `mysteryboxes.app`: `7e9292ae277fdb2e29af4f9171e3d07f69f41395`
  - `bidbolt.app`: `a59cb79faa2670383bc662c45685f28bc0476fa8`
- **Environment and permissions (read / local edit / staging / production):**
  - Read: All listed reference repositories, floor docs, and BCF-3 intake artifacts
  - Local Edit: Oscar worktree, shared docs, Oscar hive folder
  - Staging / Production: None (Local development and automated runtime testing)
- **Dependencies and owner decisions:**
  - Prerequisite: `BCF-3` (Component Inventory Intake & BOMs) - **DONE**
  - Prerequisite: `BCF-6` (Initialize BeadsILY App Repository & Pinned Tooling) - **DONE**
  - Prerequisite: `BCF-2` (Architecture ADR & Spike) - **DONE**
  - Prerequisite: `BCF-4` (Threat Model & Trust Boundaries) - **DONE**
- **Data/state invariants:**
  1. `INV-01`: Concurrent racing buyers for final kit -> Only one succeeds; zero negative stock.
  2. `INV-02`: One component short -> Complete multi-component reservation batch rolls back atomically via CHECK constraint / `RAISE(ABORT)`.
  3. `INV-03`: Pooled letter bead allowance (60 letters) for personalization without false stock aborts.
  4. `INV-04`: Single authoritative component ledger shared across party kits, mystery boxes, and school booth.
  5. `INV-05`: Assembly consumes raw components; finished goods sale consumes sealed box; no double deduction.
  6. `INV-06`: Payment-session failure cleanly releases reserved stock; retries cannot double-reserve.
  7. `INV-08`: Usable returns restock with audit; ledger records actor, reason, timestamps.
  8. `MYS-01`..`MYS-03`: Curated mystery prepacked sealed units with single consumption and session-bound idempotent retry.
- **API/database/UI changes:**
  - Create D1 migrations `migrations/0001_initial_schema.sql` and `migrations/0002_seed_launch_inventory.sql`.
  - Implement `packages/db` repository functions for atomic BOM reservation, sealed mystery unit allocation, reservation expiration, assembly packout, and movement ledger.
  - Implement automated test suite `packages/db/tests/atomic-reservation.test.mjs`.
- **Relevant acceptance case IDs:**
  - `CAT-01`, `CAT-02`, `INV-01`, `INV-02`, `INV-03`, `INV-04`, `INV-05`, `INV-06`, `INV-08`, `INV-09`, `MYS-01`, `MYS-02`, `MYS-03`.
- **Tests and evidence required:**
  - Automated test execution proving all 8 core inventory invariants pass cleanly.
  - Verified SQL migration execution with zero schema errors.
- **Physical checks required from a person:**
  - None for Phase 1 database migrations (physical assembly trial is staged under `BCF-16` / Marisol).
- **Migration/backup and rollback/reconciliation plan:**
  - Clean local git commits on branch `agent/oscar-muwid2fm`.
  - Reversible SQL schema definitions; down-migration script provided if necessary.
- **Definition of done:**
  - D1 migration files committed.
  - `packages/db` module implemented.
  - Automated test suite passing with 100% assertions.
  - Task updated in `tasks.json`; formal review request delivered to Toby and Jim via outbox.
- **Review / release status:** IN_PROGRESS
