# Owner Decisions & Sign-Off Record: BeadsILY Platform

**Author:** Michael (`god`), BeadsILY Office Manager  
**Approver / Owner:** Korry Nelson (<@U0C1GQP2LPP>)  
**Source Communication:** Slack Channel `C0C6WTWQSQ5` (`#beadsily`), Thread ts `1791281593.377149`, Reply ts `1791282098.358949`  
**Governing Ticket:** `BCF-5` (Owner Decisions Package & Brand Asset Resolution)  
**Date of Sign-Off:** October 6, 2026  

---

## 1. Formal Owner Decisions Summary

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               BEADSILY OWNER DECISIONS MATRIX                          │
├──────────────────────────┬─────────────────────────────────────────────────┬───────────┤
│ Domain                   │ Owner Decision & Specification                  │ Status    │
├──────────────────────────┼─────────────────────────────────────────────────┼───────────┤
│ 1. Canonical Domain      │ beadsily.com (Apex canonical host)              │ CONFIRMED │
│ 2. Forwarding Domain     │ beadsilly.com (301 Permanent Redirect to apex)  │ CONFIRMED │
│ 3. Canva & Brand Kit     │ Local master in OneDrive clients directory;     │ CONFIRMED │
│                          │ explicit authorization to create/edit on Canva  │           │
│ 4. Festival Booth POS    │ Primary: Stripe Terminal (card reader);         │ CONFIRMED │
│                          │ Secondary/Backup: Mercury or Bluevine Tap-to-Pay│           │
│ 5. Corporate Entity      │ Sub-company under Nelsons US LLC organization   │ CONFIRMED │
│ 6. Cloudflare Deployment │ Approved for immediate staging and deployment   │ CONFIRMED │
└──────────────────────────┴─────────────────────────────────────────────────┴───────────┘
```

---

## 2. Detailed Decision Specifications

### A. Canonical Domain & Forwarding (`SEO-02`, `SEO-03`)
- **Primary Canonical Host:** `https://beadsily.com`
- **Secondary / Typo Forwarding:** `https://beadsilly.com` and `https://www.beadsily.com` will permanently redirect with HTTP 301 to `https://beadsily.com`.
- **Implementation Status:** Verified and enforced at the Cloudflare edge middleware (`apps/storefront/src/middleware.ts` and `tests/seo.test.mjs`).

### B. Brand Identity, Vectors & Collateral Package (`BCF-5`)
- **Canva Brand Kit ID:** None previously existed on Canva.
- **Local Master Source:**
  - Branding Assets: `C:\Users\Korry\OneDrive - Razor Consulting\Clients\beadsily.com\Branding\`
  - Vector & Graphic Package: `C:\Users\Korry\OneDrive - Razor Consulting\Clients\beadsily.com\Non-Final\BEADSILY_branding_package\`
    - `01_primary_logo`: `beadsily-primary-logo-exact.svg`, `beadsily-primary-logo-vector.svg`
    - `02_secondary_logo`: `beadsily-secondary-logo-exact.svg`
    - `03_icon_submark`: `beadsily-icon-submark-exact.svg`
    - `05_supporting_motifs`: Bow, cat bead, clasp, heart bead, moon bead, star bead, and sparkle SVG vectors.
    - `06_brand_board`: `beadsily-brand-board.svg`
  - Printables & Event Collateral: `C:\Users\Korry\OneDrive - Razor Consulting\Clients\beadsily.com\Printables\`
    - `beadsily-sticker-round-3x3.pdf`
    - `beadsily-sticker-round.pdf`
    - `table-runner-border.ai`
- **Permission Grant:** Full explicit authorization granted to the engineering office to upload, edit, and create new collateral for BeadsILY on Canva or generate web-optimized SVG assets directly from the local master vector library.

### C. Festival Booth POS & Outage Protocol (`EVENT-01`, `EVENT-02`)
- **Primary Payment Hardware:** Stripe Terminal card reader.
- **Secondary / Fallback Hardware:** Mercury or Bluevine Tap-to-Pay on mobile devices.
- **Offline Protocol:** In the event of festival Wi-Fi or cellular drops, sales are logged on physical tally sheets matching `docs/event/fixtures/booth-offline-tally-sheet.csv`, with post-event batch reconciliation executed via `@beadsily/db/booth` ensuring zero inventory variance.

### D. Corporate Governance & Stripe Account Setup (`PAY-01..05`)
- **Parent Entity:** **Nelsons US LLC**
- **Stripe Account:** Dedicated BeadsILY merchant sub-account / profile under Nelsons US LLC.
- **Webhook Endpoint:** Dedicated endpoint `https://beadsily.com/api/webhooks/stripe` with HMAC signature verification and replay prevention.

### E. Cloudflare Infrastructure Provisioning
- **Approval:** Confirmed approved to deploy Workers, D1 database, R2 buckets, and Turnstile security guards.
- **Runbook:** Operational deployment commands detailed in [`docs/ops/PRODUCTION-DEPLOYMENT-AND-OPERATIONS-RUNBOOK.md`](file:///C:/repositories/beadsily-com/docs/ops/PRODUCTION-DEPLOYMENT-AND-OPERATIONS-RUNBOOK.md).

---

## 3. Impact on Engineering Tickets

- **`BCF-5` (Owner Decisions):** Formally resolved and marked **DONE**.
- **All 18 engineering tickets (`BCF-1` through `BCF-18`)** are now fully closed and verified.
