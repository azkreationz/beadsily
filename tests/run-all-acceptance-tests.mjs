/**
 * BeadsILY Master Acceptance Test Runner & Certification Harness
 * Executes all automated test suites across all 12 domains of missions/ACCEPTANCE-MATRIX.md.
 * Authored by: Toby (toby-muwie8nd), Independent QA & Compliance Certifier
 */

import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testSuites = [
  // 1. Security & Compliance (SEC-01..03, PAY-05) - Authored by Dwight
  path.join(__dirname, 'security', 'rbac.test.mjs'),
  path.join(__dirname, 'security', 'idor.test.mjs'),
  path.join(__dirname, 'security', 'csrf-origin.test.mjs'),
  path.join(__dirname, 'security', 'turnstile.test.mjs'),
  path.join(__dirname, 'security', 'stripe-security.test.mjs'),
  path.join(__dirname, 'security', 'privacy-coppa.test.mjs'),

  // 2. Catalog & Bills of Materials (CAT-01..03)
  path.join(__dirname, 'catalog', 'catalog-bom.test.mjs'),

  // 3. Inventory Concurrency & Ledger (INV-01..09)
  path.join(__dirname, 'inventory', 'inventory-concurrency.test.mjs'),

  // 4. Payments, Checkout & Webhooks (PAY-01..05)
  path.join(__dirname, 'payments', 'payments-webhooks.test.mjs'),
  path.join(__dirname, 'payments', 'embedded-checkout-integration.test.mjs'),

  // 5. Curated Mystery Craft Boxes (MYS-01..06)
  path.join(__dirname, 'mystery', 'mystery-boxes.test.mjs'),

  // 6. Subscriptions Lifecycle & Entitlements (SUB-01..06)
  path.join(__dirname, 'subscriptions', 'subscriptions.test.mjs'),

  // 7. Transactional Email & Queues (EMAIL-01..04) - Production & Acceptance Harness
  path.join(__dirname, 'email', 'email-queue.test.mjs'),
  path.join(__dirname, '..', 'packages', 'email', 'tests', 'email-queue.test.mjs'),

  // 8. Technical SEO & SSR Structured Data (SEO-01..02)
  path.join(__dirname, 'seo', 'seo-metadata.test.mjs'),

  // 9. School Festival Booth & Novice Usability (EVENT-01..02, KIT-01)
  path.join(__dirname, 'event', 'booth-reconciliation.test.mjs'),

  // 10. Storefront UI Primitives & WCAG 2.2 AA Accessibility (UI-01..05) - Authored by Erin
  path.join(__dirname, 'ui', 'storefront-components.test.mjs'),
];

console.log('======================================================================');
console.log('         BEADSILY MASTER ACCEPTANCE TEST MATRIX RUNNER                ');
console.log('======================================================================');
console.log(`Executing ${testSuites.length} test modules across 12 Acceptance Domains...`);
console.log('Requirements Covered:');
console.log('  - CAT-01..03 : Catalog, 15-Guest 45-Project BOM, Server Quote Tamper Defense');
console.log('  - INV-01..09 : Atomic Multi-Component Reservation, Zero-Row Rollback, Ledger');
console.log('  - PAY-01..05 : Price Tampering Defense, Webhook Idempotency, IDOR');
console.log('  - MYS-01..06 : Guaranteed Project Counts, Sealed Units, No Recurring Charges');
console.log('  - SUB-01..06 : Entitlement Uniqueness, Phoenix Cutoffs, Address Isolation');
console.log('  - EMAIL-01..04: Config Visibility, Bounded Retries, Decoupled Payments');
console.log('  - SEC-01..03 : RBAC, CSRF, Turnstile, COPPA & Log Scrubber');
console.log('  - SEO-01..02 : SSR Metadata, Product Schemas, 301 Canonical Redirects');
console.log('  - EVENT-01..02: School Booth POS Rehearsal & Offline Idempotent Sync');
console.log('  - KIT-01     : Novice Host Assembly Usability Verification');
console.log('  - UI-01..05  : WCAG 2.2 AA Contrast, Component Primitives, 15-Guest Touch Target');
console.log('======================================================================\n');

run({ files: testSuites })
  .on('test:fail', () => {
    process.exitCode = 1;
  })
  .compose(new spec())
  .pipe(process.stdout);
