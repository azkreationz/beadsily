# BeadsILY Commerce Platform

**Repository:** `beadsily-com`  
**Standing Mission:** [`MISSION-BEADSILY-COMMERCE.md`](file:///C:/repositories/beadsily-com-floor/missions/MISSION-BEADSILY-COMMERCE.md)  
**Floor Workspace:** `C:\repositories\beadsily-com-floor`  
**Host & Runtime:** Cloudflare (Workers, Pages/Next, D1, R2, Queues, Email Sending)  
**Payments:** Stripe Embedded Elements & Subscriptions

## Directory Layout
- `apps/storefront` — Next.js / React mobile-first accessible storefront
- `apps/operations-worker` — Background queues, scheduled reconciliation, email processing
- `packages/domain` — Shared business models (BOMs, kit recipes, mystery boxes, inventory invariants)
- `packages/db` — D1 database schemas, atomic movement ledger, migrations
- `packages/ui` — Tailwind brand tokens and accessible UI primitives
- `packages/email` — Versioned transactional email templates & Cloudflare Email Sending adapters
- `packages/integrations` — Stripe Payments & Billing SDK wrappers
- `migrations/` — D1 SQL migration files
- `docs/` — Architecture Decision Records (ADRs) and technical specifications
