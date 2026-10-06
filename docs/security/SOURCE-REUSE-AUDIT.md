# BeadsILY Source Code Reuse & Credential Provenance Audit

**Document Version:** 1.0.0  
**Date:** October 6, 2026  
**Auditor:** Dwight (`dwight-muwicook`), Security & Privacy Lead  
**Reviewers:** Jim (`jim-muwibr7y`), Toby (`toby-muwie8nd`), Michael (`god`)  
**Mission Mandate:** [`MISSION-BEADSILY-COMMERCE.md`](file:///C:/repositories/beadsily-com-floor/missions/MISSION-BEADSILY-COMMERCE.md) (Section 2 & 3)  

---

## 1. Executive Summary & Audit Scope

In accordance with Standing Mission `MISSION-BEADSILY-COMMERCE.md`, three reference codebases were authorized for strictly read-only review:
1. `C:\repositories\turbodepot` (ListMint: Next.js + Firebase Admin)
2. `C:\repositories\mysteryboxes.app` (MysteryBoxes: Next.js + Square + Firebase)
3. `C:\repositories\bidbolt.app` / `bidbolt.biz` (BidBolt: Next.js + Firebase + App Check + Multi-Tenant Marketplace)

The purpose of this audit is to:
- Detect and prevent any credential leakage, hardcoded API keys, private service keys, or external customer data from entering BeadsILY.
- Identify architectural incompatibilities between reference platforms (Firebase/GCP/Node runtime) and BeadsILY's target runtime (Cloudflare Workers, D1, R2).
- Establish strict provenance and clean-room implementation boundaries for any pattern or code considered for adaptation.

---

## 2. Reference Codebase Vulnerability & Security Findings

### 2.1. MysteryBoxes (`C:\repositories\mysteryboxes.app`)

| Severity | Finding | Location | Description & Threat Vector | BeadsILY Invariant |
| :---: | :--- | :--- | :--- | :--- |
| **CRITICAL** | Committed GCP Service Account Private Key | `serviceAccountKey.json` (Repo Root) | A full Google Cloud service account private key (`"type": "service_account"`) with RSA private key is committed directly into the Git working tree. | **ABSOLUTE PROHIBITION.** Never copy or import `serviceAccountKey.json`. Cloudflare Workers does not use GCP service accounts. |
| **CRITICAL** | Hardcoded Third-Party API Secrets in Git | `.env.production`, `.env.local` | Production API keys and access tokens for Square (`SQUARE_ACCESS_TOKEN`, `SQUARE_ACCESS_TOKEN_SANDBOX`) and ShipStation (`SHIPSTATION_API_KEY`) are stored in plain text files in the repository. | **ABSOLUTE PROHIBITION.** Never copy `.env` files. BeadsILY uses Cloudflare Workers Secrets (`wrangler secret put`) exclusively. |
| **HIGH** | Incompatible Payment Provider Architecture | `src/lib/square.ts` | Uses Square Web Payments SDK and Orders API instead of Stripe. Square webhook signatures and order state machines are incompatible with Stripe Embedded Elements. | BeadsILY uses Stripe Payment Element and Stripe Customer Portal. Square code is rejected. |
| **HIGH** | Gamblified Game Mechanics vs Physical Craft Invariants | `src/components/spinner/*`, `src/lib/mystery.ts` | Implements lottery/ticket/spinner algorithms for probabilistic reward drops. | **PROHIBITED.** Mission Section 1.1.0 explicitly forbids spinners or ticket games. Mystery is an assortment attribute of physical inventory with guaranteed project counts. |
| **MEDIUM** | Firestore Eventual Consistency & Phantom Inventory | `functions/src/orders.ts` | Relies on Firestore document writes without transactional all-or-nothing rollback across multi-component BOMs. | BeadsILY uses D1 SQLite atomic transactions with zero-row `UPDATE` checks to prevent overselling. |

### 2.2. ListMint / TurboDepot (`C:\repositories\turbodepot`)

| Severity | Finding | Location | Description & Threat Vector | BeadsILY Invariant |
| :---: | :--- | :--- | :--- | :--- |
| **HIGH** | Cloudflare Workers Runtime Incompatibility | `src/lib/firebase/admin.ts`, `auth-server.ts` | Uses `firebase-admin` Node.js SDK requiring native C++ bindings, `grpc`, and Node filesystem access that fail in Cloudflare V8 Workers isolates. | BeadsILY uses Cloudflare-native session handling and Web Crypto API (`crypto.subtle`). |
| **HIGH** | Fragile Comma-Separated Admin Email Lists | `src/lib/firebase/auth-server.ts` (L14-21) | Access control checks `TOOLDEPOTAZ_ADMIN_EMAILS` or `TURBODEPOT_ADMIN_EMAILS` in env. Lacks granular RBAC (no packer, support, or auditor roles). | BeadsILY enforces granular 5-role RBAC stored in D1 with Cloudflare Access JWT validation. |
| **MEDIUM** | Client Redirection Instead of HTTP Error Status | `src/lib/firebase/auth-server.ts` (L51, L59) | Uses Next.js `redirect('/')` inside server authentication guards, causing silent failures and redirect loops on API endpoints. | BeadsILY route guards return explicit HTTP 401 Unauthorized or HTTP 403 Forbidden with typed JSON error bodies. |
| **LOW** | Brand & Palette Mismatch | `tailwind.config.ts`, `src/styles/*` | Industrial palette (industrial gray, safety yellow) and UI components designed for used heavy tools and machinery. | Karen and Erin are designing a dedicated BeadsILY design system with playful, elegant party craft tokens. |

### 2.3. BidBolt (`C:\repositories\bidbolt.app` / `bidbolt.biz`)

| Severity | Finding | Location | Description & Threat Vector | BeadsILY Invariant |
| :---: | :--- | :--- | :--- | :--- |
| **HIGH** | Out-of-Scope Multi-Tenant Marketplace Complexity | `src/lib/consignor/*`, `src/lib/auction/*` | Implements auction bidding engines, consignor escrow settlements, vehicle freight shipping, and live stream video switching. | BeadsILY is a direct single-merchant store. Marketplace/consignor complexity is entirely excluded. |
| **MEDIUM** | Proprietary Firebase App Check Coupling | `src/lib/server/api-auth.ts` (L28-41) | Relies on Firebase App Check headers (`X-Firebase-AppCheck`) and reCAPTCHA Enterprise backend attestation. | BeadsILY uses Cloudflare Turnstile with native edge verification and server-side `siteverify` calls. |
| **POSITIVE** | Unforgeable Browser Header Origin Defense | `src/lib/server/origin-check.ts` | Enforces `Sec-Fetch-Site` validation and strict hostname whitelisting to block CSRF and cross-site scripts before route execution. | **APPROVED FOR ADAPTATION.** Pattern adapted directly into BeadsILY Workers origin middleware. |
| **POSITIVE** | Explicit Ownership IDOR Guards | `src/lib/server/api-auth.ts` (L186-205) | Verifies that authenticated user identifier strictly matches the target resource owner ID (`consignorId === uid`). | **APPROVED FOR ADAPTATION.** Pattern adapted directly into customer order and billing portal routes. |

---

## 3. Provenance & Reuse Decision Matrix

The following matrix documents every reviewed component, the evaluation result, and the implementation decision for BeadsILY:

| Component / Pattern | Source Repository | Evaluated Path | Vulnerabilities / Risks | Decision | BeadsILY Destination / Adaptation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Origin & CSRF Check** | `bidbolt.app` | `src/lib/server/origin-check.ts` | Relies on Capacitor mobile app schemes not used in BeadsILY web. | **ADAPT PATTERN** | Rewritten in clean TypeScript for Cloudflare Workers: `apps/storefront/lib/security/origin-guard.ts`. Validates `Sec-Fetch-Site` and authorized BeadsILY domains. |
| **IDOR Resource Guard** | `bidbolt.app` | `src/lib/server/api-auth.ts` | Tied to Firebase auth claims and `consignorId`. | **ADAPT PATTERN** | Clean-room implementation for customer orders: `apps/storefront/lib/security/idor-guard.ts`. Validates `order.customer_id === session.uid`. |
| **Role-Based Guards** | `bidbolt.app` | `src/lib/server/api-auth.ts` | Tied to Firebase Custom Claims and Firestore lookups. | **ADAPT PATTERN** | Rebuilt for Cloudflare Access JWTs + D1 `staff_users` table: `apps/storefront/lib/security/rbac-guard.ts`. |
| **Admin Email Check** | `turbodepot` | `src/lib/firebase/auth-server.ts` | Comma-delimited env var; no role granularity; Firebase Admin dependency. | **REJECT** | Replaced with D1 relational staff table with explicit enum roles (`owner`, `packer`, `support`, `auditor`). |
| **Square SDK Integration**| `mysteryboxes.app` | `src/lib/square.ts` | Square API; exposed sandbox and production tokens in `.env`. | **REJECT** | BeadsILY uses Stripe SDK with embedded Payment Element and server-side secret management. |
| **Spinner / Ticket Game** | `mysteryboxes.app` | `src/components/spinner/*` | Gambling / lottery mechanics; violates direct physical commerce model. | **REJECT** | BeadsILY curated mystery boxes are prepacked physical units with guaranteed project counts (e.g. 3 projects). |
| **Hardcoded Keys / Env** | `mysteryboxes.app` | `serviceAccountKey.json`, `.env.production` | Exposure of private service account keys and external API credentials. | **REJECT & AUDIT** | Zero file copying. All secrets injected via Cloudflare environment bindings (`env.STRIPE_SECRET_KEY`, etc.). |

---

## 4. Mandatory Pre-Commit Security Invariants for Engineers

All floor specialists (Jim, Pam, Oscar, Erin, Angela, Karen, Jan, Marisol) must adhere to these four hard rules:

1. **Clean-Room Development Only:**
   - No code may be copied verbatim via clipboard from reference repositories without Dwight's provenance verification.
   - Code must be authored directly in `C:\repositories\beadsily-com` or specialist worktrees (`worktrees/<specialist-id>`).
2. **Zero `.env` or Secret File Commits:**
   - The `.gitignore` file in `beadsily-com` must enforce exclusion of:
     - `.env*`
     - `*.pem`, `*.key`, `*.p12`
     - `serviceAccountKey*.json`
     - `*.credentials`
     - `*.log`
3. **No Node-Native C++ Dependencies in Workers:**
   - Never install `firebase-admin`, `bcrypt`, `native-dns`, or packages requiring Node C++ addons. Use standard Web Crypto API (`crypto.subtle`) or WebAssembly where necessary.
4. **Parameterized SQL Queries in D1:**
   - Never use string interpolation (`db.prepare(`SELECT * FROM products WHERE id = '${id}'`)`). Always use parameterized placeholders (`db.prepare('SELECT * FROM products WHERE id = ?').bind(id)`).
