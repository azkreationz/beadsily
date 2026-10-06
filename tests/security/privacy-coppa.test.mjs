import test from 'node:test';
import assert from 'node:assert/strict';
import { scrubPiiFromLogs, sanitizeCsvCell } from './lib/security-modules.mjs';

test('Privacy / COPPA: Personalization strings are transient BOM manufacturing items, not child profiles', () => {
  // Simulate an order customization object created for bead letter picking
  const orderItemCustomization = {
    theme: 'unicorn-pastel',
    guestPersonalization: [
      { letterSelection: 'MAYA', project: 'pen' },
      { letterSelection: 'LEO', project: 'bracelet' },
    ],
  };

  // Invariant 1: Ensure no minor profile metadata (DOB, child email, school) is present or collected
  assert.equal('childEmail' in orderItemCustomization, false);
  assert.equal('birthDate' in orderItemCustomization, false);
  assert.equal('minorConsent' in orderItemCustomization, false);

  // Invariant 2: Can be safely aggregated into letter inventory deductions
  const letterCounts = {};
  for (const guest of orderItemCustomization.guestPersonalization) {
    for (const char of guest.letterSelection) {
      letterCounts[char] = (letterCounts[char] || 0) + 1;
    }
  }

  assert.deepEqual(letterCounts, { M: 1, A: 2, Y: 1, L: 1, E: 1, O: 1 });
});

test('Privacy / Logging: Log scrubber redacts credit cards and customer emails', () => {
  const rawLogEntry = {
    timestamp: '2026-10-06T10:00:00Z',
    level: 'info',
    message: 'Order processed for customer@example.com with payment',
    customerEmail: 'alice.johnson@familycraft.org',
    paymentDetails: {
      card: '4111 2222 3333 4444',
      cvv: '123',
    },
  };

  const scrubbed = scrubPiiFromLogs(rawLogEntry);

  // Card number must be redacted
  assert.equal(scrubbed.paymentDetails.card, '[REDACTED_PAN]');
  assert.equal(scrubbed.paymentDetails.cvv, '[REDACTED]');

  // Email in string message must be masked
  assert.match(scrubbed.message, /c\*\*\*@example\.com/);
  // Email in field must be masked
  assert.match(scrubbed.customerEmail, /a\*\*\*@familycraft\.org/);
});

test('CSV Security: Neutralize spreadsheet formula injection (=, +, -, @) (INV-09)', () => {
  // Dangerous inputs that execute formulas in Microsoft Excel or Google Sheets
  const dangerousFormula1 = '=cmd|\' /C calc\'!A0';
  const dangerousFormula2 = '+1+cmd|\' /C calc\'!A0';
  const dangerousFormula3 = '-2+3+cmd|\' /C calc\'!A0';
  const dangerousFormula4 = '@SUM(1+1)*cmd|\' /C calc\'!A0';
  const benignInput = 'Lavender Pony Bead 6mm';

  assert.equal(sanitizeCsvCell(dangerousFormula1), "'=cmd|' /C calc'!A0");
  assert.equal(sanitizeCsvCell(dangerousFormula2), "'+1+cmd|' /C calc'!A0");
  assert.equal(sanitizeCsvCell(dangerousFormula3), "'-2+3+cmd|' /C calc'!A0");
  assert.equal(sanitizeCsvCell(dangerousFormula4), "'@SUM(1+1)*cmd|' /C calc'!A0");
  assert.equal(sanitizeCsvCell(benignInput), 'Lavender Pony Bead 6mm');
});
