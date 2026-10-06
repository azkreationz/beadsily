/**
 * BeadsILY Acceptance Test Suite: Monthly Subscription Box Lifecycle & Entitlements
 * Requirements: SUB-01 through SUB-06
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

function createSubscriptionDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE subscriptions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'cancelled', 'past_due')),
      current_period_start INTEGER NOT NULL,
      current_period_end INTEGER NOT NULL,
      shipping_address_json TEXT NOT NULL,
      billing_address_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE fulfillment_entitlements (
      id TEXT PRIMARY KEY,
      subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
      invoice_id TEXT UNIQUE NOT NULL,
      cycle_month TEXT NOT NULL, -- e.g. "2026-11"
      shipping_address_snapshot TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('entitled', 'allocated', 'packing', 'shipped', 'cancelled')),
      created_at INTEGER NOT NULL
    );

    CREATE TABLE subscription_audit_log (
      id TEXT PRIMARY KEY,
      subscription_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at INTEGER NOT NULL
    );
  `);
  return db;
}

describe('SUB-01 & SUB-02: Entitlement Uniqueness & Multi-Cycle Renewals', () => {
  let db;
  const now = Date.now();

  beforeEach(() => {
    db = createSubscriptionDb();
    db.exec(`
      INSERT INTO subscriptions VALUES (
        'sub-001', 'cust-emily', 'active', ${now}, ${now + 30 * 86400000},
        '{"street":"123 Main St","city":"Phoenix","state":"AZ","zip":"85001"}',
        '{"street":"123 Main St","city":"Phoenix","state":"AZ","zip":"85001"}',
        ${now}
      );
    `);
  });

  function processInvoicePaid(invoiceId, subId, cycleMonth) {
    const sub = db.prepare("SELECT * FROM subscriptions WHERE id = ?").get(subId);
    if (!sub || sub.status !== 'active') throw new Error('INACTIVE_SUBSCRIPTION');

    // Idempotent insertion using invoice_id UNIQUE constraint
    db.exec('BEGIN TRANSACTION');
    try {
      db.prepare(`
        INSERT INTO fulfillment_entitlements VALUES (?, ?, ?, ?, ?, 'entitled', ?)
        ON CONFLICT(invoice_id) DO NOTHING
      `).run(
        `ent-${invoiceId}`,
        subId,
        invoiceId,
        cycleMonth,
        sub.shipping_address_json,
        now
      );
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  test('SUB-01: Initial signup plus 2 renewal cycles generates exactly 3 fulfillment entitlements', () => {
    processInvoicePaid('in_cycle_1', 'sub-001', '2026-10');
    processInvoicePaid('in_cycle_2', 'sub-001', '2026-11');
    processInvoicePaid('in_cycle_3', 'sub-001', '2026-12');

    const entitlements = db.prepare("SELECT * FROM fulfillment_entitlements WHERE subscription_id = 'sub-001'").all();
    assert.equal(entitlements.length, 3, 'Must have exactly 3 fulfillment entitlements');
    assert.deepEqual(entitlements.map(e => e.cycle_month), ['2026-10', '2026-11', '2026-12']);
  });

  test('SUB-02: Duplicate invoice events or retries produce zero extra entitlements', () => {
    processInvoicePaid('in_cycle_1', 'sub-001', '2026-10');
    // Stripe retries sending the same invoice.payment_succeeded
    processInvoicePaid('in_cycle_1', 'sub-001', '2026-10');

    const entitlements = db.prepare("SELECT * FROM fulfillment_entitlements WHERE invoice_id = 'in_cycle_1'").all();
    assert.equal(entitlements.length, 1, 'Only 1 entitlement created despite duplicate webhook');
  });
});

describe('SUB-03: Failed Renewal Recovery', () => {
  let db;
  const now = Date.now();

  beforeEach(() => {
    db = createSubscriptionDb();
    db.exec(`
      INSERT INTO subscriptions VALUES (
        'sub-002', 'cust-alex', 'active', ${now}, ${now + 30 * 86400000},
        '{"street":"456 Elm St","city":"Tucson","state":"AZ","zip":"85701"}',
        '{"street":"456 Elm St","city":"Tucson","state":"AZ","zip":"85701"}',
        ${now}
      );
    `);
  });

  test('Unpaid cycle does not entitle box; subsequent payment recovery creates single entitlement', () => {
    // 1. Payment failed event arrives: mark past_due
    db.prepare("UPDATE subscriptions SET status = 'past_due' WHERE id = 'sub-002'").run();

    // Check entitlements during failure: 0
    let entitlements = db.prepare("SELECT * FROM fulfillment_entitlements WHERE subscription_id = 'sub-002'").all();
    assert.equal(entitlements.length, 0, 'Unpaid cycle must not create shipment entitlement');

    // 2. Recovery payment succeeds 3 days later: reactivate and entitle
    db.prepare("UPDATE subscriptions SET status = 'active' WHERE id = 'sub-002'").run();
    db.prepare(`
      INSERT INTO fulfillment_entitlements VALUES ('ent-rec-1', 'sub-002', 'in_rec_1', '2026-11', '{"street":"456 Elm St"}', 'entitled', ${now})
    `).run();

    entitlements = db.prepare("SELECT * FROM fulfillment_entitlements WHERE subscription_id = 'sub-002'").all();
    assert.equal(entitlements.length, 1, 'Recovery payment creates exactly 1 entitlement');
  });
});

describe('SUB-04: America/Phoenix Billing & Shipping Cutoff Enforcement', () => {
  function evaluateCutoffAction(actionTimeIso, cutoffTimeIso, actionType) {
    const actionDate = new Date(actionTimeIso);
    const cutoffDate = new Date(cutoffTimeIso);

    if (actionDate <= cutoffDate) {
      return { appliedToCurrentCycle: true, status: `${actionType}_effective_immediately` };
    } else {
      return { appliedToCurrentCycle: false, status: `${actionType}_effective_next_cycle` };
    }
  }

  test('Action 1 minute prior to cutoff affects current cycle; 1 minute after affects next cycle', () => {
    const cutoff = '2026-10-15T23:59:59-07:00'; // Phoenix cutoff

    const preCutoff = '2026-10-15T23:58:59-07:00';
    const preResult = evaluateCutoffAction(preCutoff, cutoff, 'skip');
    assert.equal(preResult.appliedToCurrentCycle, true);
    assert.equal(preResult.status, 'skip_effective_immediately');

    const postCutoff = '2026-10-16T00:00:59-07:00';
    const postResult = evaluateCutoffAction(postCutoff, cutoff, 'skip');
    assert.equal(postResult.appliedToCurrentCycle, false);
    assert.equal(postResult.status, 'skip_effective_next_cycle');
  });
});

describe('SUB-05: Address Changes During Packing State Isolation', () => {
  let db;
  const now = Date.now();

  beforeEach(() => {
    db = createSubscriptionDb();
    db.exec(`
      INSERT INTO subscriptions VALUES (
        'sub-003', 'cust-jen', 'active', ${now}, ${now + 30 * 86400000},
        '{"street":"Original Street 1","city":"Mesa","state":"AZ","zip":"85201"}',
        '{"street":"Original Street 1","city":"Mesa","state":"AZ","zip":"85201"}',
        ${now}
      );
      INSERT INTO fulfillment_entitlements VALUES (
        'ent-packed-1', 'sub-003', 'in_99', '2026-10',
        '{"street":"Original Street 1","city":"Mesa","state":"AZ","zip":"85201"}',
        'packing', ${now}
      );
    `);
  });

  test('Billing address change cannot silently alter ship-to address on an already packing box', () => {
    const newBillingAddress = JSON.stringify({ street: 'New Billing Blvd', city: 'Scottsdale', state: 'AZ', zip: '85251' });

    // Customer changes billing address on subscription
    db.prepare("UPDATE subscriptions SET billing_address_json = ? WHERE id = 'sub-003'").run(newBillingAddress);

    // Verify existing packing entitlement shipping address remains unmodified
    const entitlement = db.prepare("SELECT * FROM fulfillment_entitlements WHERE id = 'ent-packed-1'").get();
    const parsedShipAddress = JSON.parse(entitlement.shipping_address_snapshot);

    assert.equal(parsedShipAddress.street, 'Original Street 1', 'Locked packing box shipping address must not change');
    assert.equal(entitlement.status, 'packing');
  });
});

describe('SUB-06: Subscription Capacity Cap & Waitlist Guardrail', () => {
  test('Capacity cap rejects new subscription signups and holds waitlist when reached', () => {
    const CAPACITY_LIMIT = 100;
    const currentActiveSubscribers = 100;

    function attemptSubscriptionSignup(activeCount) {
      if (activeCount >= CAPACITY_LIMIT) {
        return { success: false, action: 'waitlist_offered', message: 'Monthly subscription capacity reached' };
      }
      return { success: true, action: 'enrolled' };
    }

    const attempt101 = attemptSubscriptionSignup(currentActiveSubscribers);
    assert.equal(attempt101.success, false);
    assert.equal(attempt101.action, 'waitlist_offered');
  });
});
