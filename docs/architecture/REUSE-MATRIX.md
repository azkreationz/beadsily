# BeadsILY Architecture Reuse & Reference Evaluation Matrix

**Date:** October 6, 2026  
**Status:** COMPLETE (Architectural Audit & Guardrails)  
**Author:** Jim (Cloudflare Solutions Architect)  
**Security Reviewer:** Dwight (Security & Privacy Lead)  
**Independent QA Reviewer:** Toby (Independent QA Certifier)  
**Mission Directive:** Read-only inspection of reference repositories (`turbodepot`, `mysteryboxes.app`, `bidbolt.app`). Strict prohibition against modifying reference repos, copying credentials/.env files, or adopting incompatible business models (gambling, auctions, marketplaces).

---

## 1. Reference Repositories & Pinned Baselines

| Repository Identifier | Local Path | Pinned Commit (HEAD) | Original Architecture | BeadsILY Relationship |
| :--- | :--- | :--- | :--- | :--- |
| **ListMint (`turbodepot`)** | `C:\repositories\turbodepot` | `bd1704c690607cf32972f0ed8eed42897c0d583e` | Next.js 15, React 19, Firebase Admin, Tailwind 3.4, Radix UI | Component styling, accessible UI primitives, design tokens |
| **MysteryBoxes (`mysteryboxes.app`)** | `C:\repositories\mysteryboxes.app` | `7e9292ae277fdb2e29af4f9171e3d07f69f41395` | Next.js, Chakra UI, Firebase, Square, Roulette Gamification | Admin RBAC vocabulary, tier modeling, pick queue UX |
| **BidBolt (`bidbolt.app`)** | `C:\repositories\bidbolt.app` | `a59cb79faa2670383bc662c45685f28bc0476fa8` | Next.js, Capacitor Mobile, Firebase Functions, K6 Load Tests | Concurrent race condition test patterns, stress simulation |

---

## 2. Comprehensive Module-by-Module Reuse Matrix

| Source Repository | Pinned Blob / Path | Target Purpose | Dependency Footprint | License / IP Check | Security / Vulnerability Audit | Architectural Decision | Verification Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ListMint** | `package.json`<br/>`@radix-ui/react-*` | Accessible UI primitives (dialogs, dropdowns, accordions, popovers, labels) | Pure React 19 client components; zero Node runtime dependencies | MIT License; clean open-source | No known vulnerabilities. Compatible with SSR edge rendering. | **ADOPT** into `packages/ui`. Essential for WCAG AA compliance. | Toby automated accessibility audit (A11Y-01). |
| **ListMint** | `package.json`<br/>`lucide-react`, `clsx`, `tailwind-merge` | Iconography and Tailwind class variance utilities | Zero-dependency client utilities | MIT License | Clean, tree-shakeable icons and utilities. | **ADOPT** into `packages/ui`. Standard modern frontend stack. | Bundled size check in Vite build. |
| **ListMint** | `package.json`<br/>`firebase`, `firebase-admin` | Backend datastore, server SDK, and authentication | Heavy Node.js gRPC dependencies, service account secrets, cold starts | Proprietary Google SDK / Apache 2.0 | High risk on Cloudflare Workers; unsupported gRPC bindings. | **STRICTLY REJECT**. Replaced by Cloudflare D1 and Web Crypto. | D1 schema execution and zero Firebase imports check. |
| **ListMint** | `package.json`<br/>`@genkit-ai/*` | AI product listing generation and categorization | Large AI SDK footprint | Apache 2.0 | Unnecessary complexity for curated single-merchant craft kits. | **STRICTLY REJECT**. BeadsILY utilizes human-authored catalog records. | Dependency audit during CI. |
| **MysteryBoxes** | `src/constants/adminPermissions.js`<br/>`736c87dd56` | Role-based access control (RBAC) permission vocabulary | Single JavaScript constants file | Proprietary / Internal | Clean declarative permissions model. | **ADAPT** into TypeScript enum in `packages/domain` for Dwight's edge middleware. | Dwight staff authorization test (AUTH-04). |
| **MysteryBoxes** | `src/utils/tierConfig.js`<br/>`36cc091013` | Multi-tier catalog modeling and badge attributes | Simple config mapping | Proprietary / Internal | Clean configuration schema. | **ADAPT** into physical craft box models (`Mystery Maker`, `Bestie Duo`, `Mystery Party`) with fixed minor-unit pricing. | BOM validation test for guaranteed project counts. |
| **MysteryBoxes** | `src/pages/admin/pick-queue.js`<br/>`1615513f7b` | Fulfillment pick/pack queue for warehouse staff | React UI with Firestore real-time listener | Proprietary / Internal | Incompatible Firestore listener; UI workflow is sound. | **ADAPT UX WORKFLOW** into Erin's admin portal backed by D1 REST/RPC endpoints. | Rehearsal picking workflow test (OPS-01). |
| **MysteryBoxes** | `docs/spinner-pick-flow.md`<br/>`174daee98b` | Roulette wheel animation, ticket balances, prize odds | Gamification / casino mechanics | Proprietary / Internal | **COMPLIANCE RISK**: Simulates gambling/lottery; strictly prohibited by BeadsILY craft mission. | **STRICTLY REJECT**. BeadsILY mystery boxes are physical sealed inventory with guaranteed project counts. | Toby compliance verification (MYS-01..05). |
| **MysteryBoxes** | Square Web Payments integration | Credit card tokenization and charge API | Square SDK | Commercial SDK | Vendor fragmentation; does not support unified subscriptions. | **STRICTLY REJECT**. Standardized on Stripe Elements and Billing. | Stripe payment integration test (PAY-01). |
| **BidBolt** | `tests/load/scenarios/concurrent-bidding.js`<br/>`9a14c330e2` | High-concurrency race condition testing scripts | K6 load testing script | Proprietary / Internal | Clean load generator for concurrent database mutations. | **ADAPT** for Toby's test suite to simulate simultaneous checkouts racing for final kit components. | Concurrent reservation test (INV-01, INV-02). |
| **BidBolt** | `cap:sync`<br/>`@capacitor/*` | Native mobile iOS and Android app wrappers | Heavy native SDK bindings (Cocoapods, Gradle) | MIT License | Premature complexity; mission requires mobile web QR code for festival. | **DEFER TO PHASE 4**. Focus on accessible responsive mobile web for booth. | Mobile browser viewport and touch target tests. |

---

## 3. Strict Operating Isolation Rules

1. **Read-Only Pinned Access:** Under no circumstances shall any agent edit, delete, commit to, or run scripts inside `C:\repositories\turbodepot`, `C:\repositories\mysteryboxes.app`, or `C:\repositories\bidbolt.app`.
2. **Zero Credential Transfer:** No `.env`, service account JSON, Stripe keys, Firebase credentials, or customer data from reference repositories may ever be copied into BeadsILY.
3. **Clean Code Provenance:** Any adapted logic (such as permission constants or K6 test scripts) must be committed with explicit author attribution, TypeScript types, and unit tests validating compliance with BeadsILY's Cloudflare D1/Workers architecture.
