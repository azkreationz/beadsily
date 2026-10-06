import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyOrderAccess } from './lib/security-modules.mjs';

const mockOrderA = {
  id: 'ord_101',
  customerId: 'cust_alice',
  status: 'confirmed',
  shippingAddress: '123 Peach Lane, Phoenix, AZ',
  items: [{ id: 'item_1', name: '15-Guest Unicorn Kit', quantity: 1 }],
  packingChecklist: ['45 Pens', '45 Focal Beads'],
  billingDetails: { cardLast4: '4242', stripePaymentIntentId: 'pi_abc123' },
};

const mockOrderB = {
  id: 'ord_102',
  customerId: 'cust_bob',
  status: 'shipped',
  shippingAddress: '456 Lemon St, Scottsdale, AZ',
  items: [{ id: 'item_2', name: 'Mystery Maker Box', quantity: 2 }],
  packingChecklist: ['2 Sealed Mystery Maker Units'],
  billingDetails: { cardLast4: '1111', stripePaymentIntentId: 'pi_xyz789' },
};

const mockGuestOrder = {
  id: 'ord_guest_999',
  customerId: null,
  guestAccessToken: 'sec_tok_998877665544332211',
  status: 'confirmed',
  shippingAddress: '789 Desert Way, Tempe, AZ',
  items: [{ id: 'item_3', name: 'Bestie Mystery Duo', quantity: 1 }],
};

test('IDOR: Unauthenticated visitor rejected', () => {
  const result = verifyOrderAccess(null, mockOrderA);
  assert.equal(result.allowed, false);
  assert.equal(result.status, 401);
});

test('IDOR: Customer A can access their own order', () => {
  const aliceSession = { uid: 'cust_alice', role: 'customer' };
  const result = verifyOrderAccess(aliceSession, mockOrderA);
  assert.equal(result.allowed, true);
  assert.equal(result.accessType, 'customer_owner');
});

test('IDOR: Customer A cannot access Customer B order (IDOR defense)', () => {
  const aliceSession = { uid: 'cust_alice', role: 'customer' };
  const result = verifyOrderAccess(aliceSession, mockOrderB);
  assert.equal(result.allowed, false);
  assert.equal(result.status, 403);
  assert.match(result.reason, /Access denied/);
});

test('IDOR: Customer B cannot access Customer A order', () => {
  const bobSession = { uid: 'cust_bob', role: 'customer' };
  const result = verifyOrderAccess(bobSession, mockOrderA);
  assert.equal(result.allowed, false);
  assert.equal(result.status, 403);
});

test('IDOR: Customer Support staff can view order for customer assistance', () => {
  const supportSession = { uid: 'staff_jim', role: 'support' };
  const result = verifyOrderAccess(supportSession, mockOrderA);
  assert.equal(result.allowed, true);
  assert.equal(result.accessType, 'staff_support');
});

test('IDOR: Owner staff can access any order', () => {
  const ownerSession = { uid: 'staff_korry', role: 'owner' };
  const result = verifyOrderAccess(ownerSession, mockOrderB);
  assert.equal(result.allowed, true);
  assert.equal(result.accessType, 'staff_support');
});

test('IDOR: Warehouse Packer receives sanitized order without billing data', () => {
  const packerSession = { uid: 'staff_packer', role: 'packer' };
  const result = verifyOrderAccess(packerSession, mockOrderA);
  assert.equal(result.allowed, true);
  assert.equal(result.accessType, 'packer_view');
  assert.ok(result.sanitizedOrder);
  assert.equal(result.sanitizedOrder.orderId, 'ord_101');
  assert.equal(result.sanitizedOrder.billingDetails, undefined, 'Packer must never see billing metadata');
});

test('IDOR: Guest order verified with high-entropy token', () => {
  const validGuestSession = { guestAccessToken: 'sec_tok_998877665544332211' };
  const result = verifyOrderAccess(validGuestSession, mockGuestOrder);
  assert.equal(result.allowed, true);
  assert.equal(result.accessType, 'guest_verified');

  const invalidGuestSession = { guestAccessToken: 'sec_tok_WRONG_TOKEN_VALUE' };
  const invalidResult = verifyOrderAccess(invalidGuestSession, mockGuestOrder);
  assert.equal(invalidResult.allowed, false);
  assert.equal(invalidResult.status, 403);
});
