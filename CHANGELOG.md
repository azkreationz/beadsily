# Changelog

All notable changes to the BeadsILY direct-to-consumer platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.5] - 2026-10-06

### Interactive Party Kit Configurator, Guest Count Tiers (15-30), Save the Date Calendar & Mobile Button Optimization
*Delivered full client-side theme selection, 5-guest increment tiers (15, 20, 25, 30), RFC 5545 downloadable calendar invite (.ics) & Google Calendar integration for the Santa Fe Fall Festival, dynamic checkout pricing, and mobile touch target enhancements.*

#### Added
- **Interactive Theme & Package Configurator (`/party-kits`):**
  - Made all 4 launch themes fully selectable (`PK-15-TAY` Taylor's Era, `PK-15-BOHO` Desert Bloom, `PK-15-NEON` Glow Neon Daisy, `PK-15-PRN` Mermaid Cove) with instant visual feedback, active state borders, and checkmark indicators.
  - Implemented selectable guest counts in quantities of 5 extra: 15 guests (Base, 45 projects, $189.00), 20 guests (+5 guests, 60 projects, $249.00), 25 guests (+10 guests, 75 projects, $309.00), and 30 guests (+15 guests, 90 projects, $369.00).
  - Embedded client-side reactive calculations updating Order Summary, extra guest line item, total price, per-guest rate, and checkout CTA link dynamically.
- **Save the Date & Add to Calendar (`/events/beadsily-launch.ics`):**
  - Implemented RFC 5545 compliant `.ics` endpoint for the Santa Fe Elementary Fall Festival soft launch event (Friday, Oct 23, 2026, 5:00 PM – 8:00 PM MST).
  - Added dual "Save Date (.ics)" and "Google Cal ↗" action buttons to the hero event card, as well as an "Add to Calendar 📅" link in the top announcement bar.
- **Dynamic Secure Checkout Route (`/checkout`):**
  - Added dedicated checkout page dynamically computing theme descriptions, guest counts, and project breakdowns (pens, keychains, bracelets) from query parameters.
- **Mobile Button Ergonomics & Touch Target Optimization:**
  - Upgraded mobile hero form button, header button, and mystery box buttons to minimum 44px/48px touch targets with responsive full-width mobile behavior to prevent wrapping or clipping on narrow viewports.

---

## [1.2.4] - 2026-10-06

### Admin Gatekeeper Security, Passkey Protection & Search Engine Concealment
*Enforced strict authentication barrier for /admin and subscriber exports using unique administrative passkeys, cryptographic HMAC-SHA256 session cookies (@beadsily/auth), and noindex crawl prevention.*

#### Added
- **Admin Gatekeeper Authentication Barrier (`/admin/login` & `/admin/logout`):**
  - Gated `/admin`, `/admin/subscribers`, and `/admin/subscribers.csv` behind passkey validation.
  - Implemented branded Admin Gatekeeper login UI with Pearl Cream canvas, Soft Black typography, Bubble Pink CTA, and error feedback.
  - Leveraged `@beadsily/auth` to issue tamper-evident HMAC-SHA256 signed session tokens stored in `__Host-beadsily_session` cookies with `Secure`, `HttpOnly`, and `SameSite=Strict`.
  - Added dedicated `/admin/logout` flow with cookie revocation.
- **Search Engine Concealment & Robots Defense:**
  - Injected `<meta name="robots" content="noindex, nofollow, noarchive" />` across all `/admin` routes.
  - Configured edge HTTP response header `X-Robots-Tag: noindex, nofollow, noarchive` ensuring zero search engine indexing or public discovery.
- **API & Script Authorization Support:**
  - Added support for `Authorization: Bearer <ADMIN_PASSKEY>` and `X-Admin-Passkey` headers on administrative endpoints.
  - Returns `401 Unauthorized` on unauthenticated direct attempts to `/admin/subscribers.csv`.

---

## [1.2.3] - 2026-10-06

### Domain Aliasing, Favicon Deployment, Phrasing Refinement & Admin Command Center
*Activated beadsilly.com 301 canonical redirects, deployed official favicon from R2, removed repetitive phrasing, and launched operational /admin portal with real-time D1 subscriber export.*

#### Added
- **Domain Alias Edge Routing (`beadsilly.com` & `www.beadsilly.com`):**
  - Attached custom domain triggers in `apps/storefront/wrangler.jsonc`.
  - Cloudflare Anycast edge intercepts traffic and issues `301 Moved Permanently` to canonical `https://beadsily.com/`.
- **Favicon & Web App Manifest Serving:**
  - Deployed official `favicon.ico`, Apple touch icon, and PNG favicons from brand package to Cloudflare R2 (`beadsily-media-prod`).
  - Added `<link rel="icon" type="image/x-icon" href="/favicon.ico" />` in HTML head and Worker streaming route for `/favicon.ico`.
- **Admin Command Center (`/admin` & `/admin/subscribers.csv`):**
  - Integrated live operational portal reporting VIP email subscribers stored in Cloudflare D1 (`beadsily-production-d1`).
  - Added instant CSV download endpoint `/admin/subscribers.csv` for mailing list management.
  - Added operational status cards for email outbox, package tiers, R2 media storage, and offline booth POS reconciliation.

#### Changed
- **Storefront Copy De-Cluttering:**
  - Removed repetitive `(45 keepsakes guaranteed)` phrasing from hero teaser, feature badges, preview card, and global footer. Retained detailed project counts within specifications.

---

## [1.2.2] - 2026-10-06

### Authentic Craft Bead Flatlay Backdrop & Official Vector Header Wordmark
*Replaced stock photo with bespoke BeadsILY craft bead flatlay background and integrated official beadsily-wordmark-color.svg in the global storefront header per owner directive.*

#### Added
- **Official Vector Header Logo (`beadsily-wordmark-color.svg`):**
  - Integrated official outlined vector logo directly into the navigation header (`/brand/beadsily-wordmark-color.svg`).
  - Preserved the Cinzel uppercase "Bead Bar" pill badge alongside the wordmark with soft black outlines and bubble pink accents.
  - Implemented edge Worker route handler serving brand SVGs directly with HTTP caching headers (`image/svg+xml`).
- **Authentic Craft Bead Flatlay Photographic Backdrop:**
  - Generated and deployed authentic flat-lay photography featuring actual BeadsILY supplies: smooth pastel pink silicone beads, lustrous pearl cream beads, glossy black beads, gold star charms, pink heart beads, metallic rose gold pen rods, and lobster clasps.
  - Stored locally and uploaded to remote Cloudflare R2 bucket `beadsily-media-prod` (`beadsily-craft-beads-flatlay.jpg`).
  - Configured Worker media streaming endpoint (`/images/*` and `/media/*`) with ETag and immutable cache headers.

#### Changed
- **Teaser Page Backdrop:**
  - Replaced Unsplash jewelry/brooch image with authentic BeadsILY craft bead flatlay backdrop under on-brand contrast gradient overlay.

---

## [1.2.1] - 2026-10-06

### Custom Domain Routing & WWW Subdomain Resolution
*Attached canonical apex domain beadsily.com and www.beadsily.com directly to Cloudflare Workers edge, resolving DNS_PROBE_FINISHED_NXDOMAIN and enabling global zero-cold-start access.*

#### Added
- **Cloudflare Workers Custom Domain Triggers (`apps/storefront/wrangler.jsonc`):**
  - Configured apex `beadsily.com` and subdomain `www.beadsily.com` as active custom domain routes.
  - Enabled dual routing with `"workers_dev": true` ensuring test automation, preview scripts, and fallback edges remain accessible.
  - Cloudflare edge automatically provisions SSL/TLS edge certificates and provisions Anycast DNS routing across all global points of presence.
- **Apex Canonical 301 Redirect:**
  - Automated permanent 301 redirection from `https://www.beadsily.com` to canonical apex `https://beadsily.com/`.

#### Fixed
- **Resolved `DNS_PROBE_FINISHED_NXDOMAIN`:**
  - Attached custom domain to storefront worker, activating DNS zone mapping and live HTTPS delivery. Verified `200 OK` on `https://beadsily.com` and `https://beadsily.com/health`.

---

## [1.2.0] - 2026-10-06

### Teaser Landing Page & Cloudflare D1 Email Subscription Engine
*Launched full-screen on-brand teaser landing page on root apex host with email updates subscription linked to Cloudflare D1 database per owner directive.*

#### Added
- **Full-Screen On-Brand Teaser Landing Page (`GET /`):**
  - Designed full-screen background using high-resolution craft photography with on-brand gradient overlay (Soft Black `#171416`, Pearl Cream `#FFF8EF`, Bubble Pink `#FF689D`).
  - Added frosted glass container with prominent `BEADSILY` wordmark, Cinzel tracking, and campaign line *"Something Lovely is In the Making — A little charm. A lot of heart."*
  - Added Fall Festival announcement callout: *"Santa Fe Elementary Fall Festival • Friday, Oct 23, 2026 (5–8 PM MST)"*.
  - Added interactive VIP email subscription form with real-time feedback and state persistence (`/?subscribed=1#subscribe`).
  - Added launch preview cards linking to `/party-kits` and `/mystery-boxes` for early shoppers and reviewers.
- **Cloudflare D1 Email Subscription Database:**
  - Authored and applied remote migration [`migrations/0003_email_subscribers.sql`](file:///C:/repositories/beadsily-com/migrations/0003_email_subscribers.sql) creating `email_subscribers` table with indexing on `beadsily-production-d1`.
  - Implemented `POST /api/subscribe` supporting both JSON payload and HTML form submissions with client metadata tracking (country, user agent, timestamp).

---

## [1.1.3] - 2026-10-06

### Canva Graphics Layout Briefs & Asset Specifications
*Delivered comprehensive Canva design briefs, exact canvas pixel dimensions, color swatch guides, and copy blocks for Korry and the design team.*

#### Added
- **Canva Design Briefs & Specifications (`docs/brand/CANVA-GRAPHICS-LAYOUT-BRIEFS.md`):**
  - Authored complete design briefs across 5 production formats:
    1. OpenGraph / Social Share Card (`1200 x 630 px`).
    2. Official Festival Canopy Banner (`96 x 24 inches` / `8 x 2 ft` at print resolution).
    3. Storefront Desktop & Square Hero CTA Banners (`1920 x 1080 px` and `1080 x 1080 px`).
    4. Santa Fe Fall Festival Announcement Story / Reel / Handout Flyer (`1080 x 1920 px`).
    5. Tabletop Assembly & Host Quick-Start Card (`5 x 7 inches` double-sided printable).
  - Outlined exact Canva Brand Kit hex codes, font pairings, safe zones, and customer-tested copy blocks.

---

## [1.1.2] - 2026-10-06

### Official Brand Guidelines Integration & Typography Styling
*Integrated official Brand Direction & Usage specification from founder Korry Nelson into design tokens, typography, and edge storefront.*

#### Added
- **Official Brand Direction & Usage Documentation:**
  - Authored [`docs/brand/BRAND-DIRECTION-AND-USAGE.md`](file:///C:/repositories/beadsily-com/docs/brand/BRAND-DIRECTION-AND-USAGE.md) documenting positioning, logo system, clear space, minimum sizing rules, official 9-color RGB/CMYK palette, Cinzel and Poppins typography rules, and illustration standards.

#### Changed
- **Typography & Font System:**
  - Added Google Fonts imports for **Cinzel** (headings, labels, and badges) and **Poppins** (body and supporting copy).
  - Aligned Pearl Cream canvas to authoritative `#FFF8EF` and Pearl Shade to `#E7DECB`.
  - Updated storefront header wordmark to match the official spec: uninterrupted **BEADSILY** with **BEADS** in soft black (`#171416`) and **ILY** in bubble pink (`#FF689D`).
  - Added approved campaign copy directions to hero banner: *"A little charm. A lot of heart."* and *"Pick your beads. Make it yours."*
  - Redeployed live edge Worker (`82f07f28-1833-48f5-824e-d677f5c203c3`) to [`https://beadsily-storefront.razoraz.workers.dev`](https://beadsily-storefront.razoraz.workers.dev).

---

## [1.1.1] - 2026-10-06

### Customer-Centric Copy Polish & Internal Jargon Removal
*Removed engineering ticket codes, compliance standards, and infrastructure jargon from all customer-facing storefront pages and Worker templates per owner directive.*

#### Changed
- **Storefront Copy Polish & Jargon Removal:**
  - Removed internal engineering ticket identifiers (`MYS-01`, `MYS-02`, `KIT-01`) from all customer-facing mystery box summaries, host guide links, and FAQ answers.
  - Replaced technical footer section "Our Invariants" with warm, customer-facing promise header "The BeadsILY Promise".
  - Replaced internal compliance jargon ("WCAG 2.2 AA Contrast Compliance", "Server-Verified Pricing") with accessible, craft-friendly value statements ("Designed with love for crafters of all ages", "Guaranteed 45 Finished Keepsakes").
  - Simplified checkout loading state from "Initializing Stripe Secure Session..." to friendly "Securing your checkout...".
  - Redeployed live edge Worker (`9fec4ed3-a05e-413e-ac36-c03d024bba6d`) to [`https://beadsily-storefront.razoraz.workers.dev`](https://beadsily-storefront.razoraz.workers.dev).

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
