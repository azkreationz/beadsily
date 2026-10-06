# BeadsILY Task Contract: BCF-9

- **Task ID / phase:** BCF-9 / Phase 1 (Foundation Build)
- **Title:** Phase 1: Turnstile Edge Middleware & Session Authorization
- **Business trigger and resulting behavior:** Delivers production-grade Cloudflare Workers middleware for session authentication, cryptographic token issuance/verification, staff RBAC route guards, Cloudflare Turnstile server-side validation, and origin/CSRF defense.
- **Accountable implementer:** Dwight (`dwight-muwicook`), Security & Privacy Lead
- **Independent reviewer(s):** Jim (`jim-muwibr7y`), Cloudflare Solutions Architect; Toby (`toby-muwie8nd`), Independent QA Certifier
- **BeadsILY repository / branch / workspace:** `C:\repositories\beadsily-com` / `agent/dwight-muwicook` / `C:\repositories\beadsily-com-floor\worktrees\dwight-muwicook`
- **Allowed paths / assets / resources:** `packages/auth/**`, `docs/security/**`, `tests/security/**`
- **Read-only source repositories and pinned snapshots:**
  - `C:\repositories\beadsily-com\docs\security\THREAT-MODEL.md` (Dwight, BCF-4)
  - `C:\repositories\beadsily-com\docs\architecture\ADR-002-NEXT-RUNTIME-SPIKE.md` (Jim, BCF-2)
- **Environment and permissions:** Local edit in worktree; local automated test execution; commit locally to branch `agent/dwight-muwicook`.
- **Dependencies and owner decisions:**
  - Prerequisites: BCF-4 (Threat Model — DONE), BCF-6 (Init Repo — DONE).
  - Downstream dependencies: BCF-7 (D1 Migrations), BCF-11 (Storefront UI), BCF-12 (Stripe Checkout).
- **Data/state invariants:**
  1. Standard Web Crypto API (`crypto.subtle`) only; zero Node native C++ bindings or `firebase-admin` dependencies.
  2. Sessions cryptographically signed with HMAC-SHA256, carrying expiration and role claims.
  3. Session cookies configured with `__Host-` prefix, `HttpOnly`, `Secure`, `SameSite=Lax`, and `Path=/`.
  4. Turnstile tokens verified via `https://challenges.cloudflare.com/turnstile/v0/siteverify` with single-use replay protection.
  5. Granular staff RBAC (`owner`, `packer`, `support`, `auditor`) enforced on all `/admin/*` and `/ops/*` routes.
  6. Origin checking rejects cross-site mutations using `Sec-Fetch-Site: cross-site`.
- **API/database/UI changes:**
  - Creation of `packages/auth` containing modular TypeScript/ESM middleware:
    - `packages/auth/session.ts` — Web Crypto session signing, token verification, and cookie generation.
    - `packages/auth/rbac.ts` — Role permission matrix and route authorization guards.
    - `packages/auth/turnstile.ts` — Turnstile verification middleware with replay protection.
    - `packages/auth/origin.ts` — CSRF and origin defense middleware.
    - `packages/auth/index.ts` — Unified public API exports.
- **Relevant acceptance case IDs:** `SEC-01`, `SEC-02`, `SEC-03`.
- **Tests and evidence required:** Automated test suite demonstrating 100% pass rate for session issuance, tampering detection, expiration rejection, RBAC route protection, Turnstile validation, and origin checking.
- **Physical checks required from a person:** None.
- **Migration/backup and rollback/reconciliation plan:** Git branch isolation (`agent/dwight-muwicook`).
- **Definition of done:**
  1. Complete `packages/auth` implementation.
  2. Automated test suite verifying all invariants under Workers runtime compatibility.
  3. Independent review request dispatched to Jim and Toby.
- **Review / release status:** IN_PROGRESS
