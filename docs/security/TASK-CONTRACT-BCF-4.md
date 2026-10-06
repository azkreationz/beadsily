# BeadsILY Task Contract: BCF-4

- **Task ID / phase:** BCF-4 / Phase 0 (Discovery & Boundaries)
- **Title:** Phase 0: System Threat Model & Security Trust Boundaries
- **Business trigger and resulting behavior:** Establishes the authoritative cybersecurity foundation, STRIDE threat model, staff RBAC matrix, Cloudflare Turnstile server-side validation flow, Stripe/email security boundaries, reference code audit, and COPPA/privacy controls before code/schema implementation begins in Phase 1.
- **Accountable implementer:** Dwight (`dwight-muwicook`), Security & Privacy Lead
- **Independent reviewer(s):** Jim (`jim-muwibr7y`), Cloudflare Solutions Architect; Toby (`toby-muwie8nd`), Independent QA Certifier
- **BeadsILY repository / branch / workspace:** `C:\repositories\beadsily-com` / `agent/dwight-muwicook` / `C:\repositories\beadsily-com-floor\worktrees\dwight-muwicook`
- **Allowed paths / assets / resources:** `docs/security/**`, `tests/security/**`
- **Read-only source repositories and pinned snapshots:**
  - `C:\repositories\turbodepot` (ListMint — Next.js + Firebase)
  - `C:\repositories\mysteryboxes.app` (MysteryBoxes — Next.js + Square + Firebase)
  - `C:\repositories\bidbolt.app` / `bidbolt.biz` (BidBolt — Next.js + Firebase App Check)
- **Environment and permissions:** Local edit in worktree; local automated test execution; no remote git push; no external network mutation.
- **Dependencies and owner decisions:**
  - Prerequisite: BCF-1 (Adopt Standing Mission & Specialist Hires — DONE).
  - Downstream dependencies: BCF-6 (Initialize Repo), BCF-7 (D1 Migrations), BCF-9 (Turnstile Edge Middleware & Session Auth), BCF-10 (Test Harness).
- **Data/state invariants:**
  1. Complete server-side authority: client input is strictly untrusted. Amounts, currencies, inventory allocations, and user identities are computed or verified server-side.
  2. Least-privilege staff RBAC: roles (`owner`, `packer`, `support`, `auditor`) strictly enforced at the Worker route level.
  3. Turnstile tokens are validated server-side against Cloudflare's endpoint with single-use replay prevention.
  4. Webhook signatures (`stripe-signature`) verified against raw body buffer; events logged durably before dispatch.
  5. Privacy & COPPA: BeadsILY targets adult purchasers. Personalization names/letters are treated solely as ephemeral manufacturing/BOM data, never collected or stored as children's profiles or directory records.
- **API/database/UI changes:**
  - Technical security specification and architecture documentation (`THREAT-MODEL.md`, `SOURCE-REUSE-AUDIT.md`).
  - Automated security test suite in `tests/security/` verifying authorization, origin checking, Turnstile validation, IDOR prevention, and Stripe HMAC verification.
- **Relevant acceptance case IDs:** `SEC-01`, `SEC-02`, `SEC-03`, `PAY-01`, `PAY-03`, `PAY-05`, `INV-09`, `EMAIL-04`.
- **Tests and evidence required:**
  - Automated test suite executed via bundled Node test runner (`node --test`) covering RBAC permissions, IDOR prevention, CSRF origin verification, Turnstile verification and replay blocking, Stripe signature checks, and PII redaction.
- **Physical checks required from a person:** None (specification and automated test suite).
- **Migration/backup and rollback/reconciliation plan:** Git branch isolation (`agent/dwight-muwicook`); clean revertable commits.
- **Definition of done:**
  1. Comprehensive Threat Model and Security Architecture document delivered in `docs/security/THREAT-MODEL.md`.
  2. Complete Source Reuse and Credential Audit delivered in `docs/security/SOURCE-REUSE-AUDIT.md`.
  3. Working automated security test suite in `tests/security/` with 100% pass rate.
  4. Independent review handoff submitted to Jim and Toby; status updated on tasks board.
- **Escalation condition and next independent task:** Escalate any detected external credential leaks to Michael (`god`); next task is BCF-9 (Phase 1 Turnstile & Session Authorization).
- **Review / release status:** READY_FOR_REVIEW
