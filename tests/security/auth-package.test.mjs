import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSessionToken,
  verifySessionToken,
  formatSessionCookie,
  formatSessionClearCookie,
  extractSessionCookie,
  authorizeSessionRole,
  authorizeStaff,
  authorizeOwner,
  isActionPermitted,
  validateTurnstileToken,
  InMemoryTurnstileReplayCache,
  verifyRequestOrigin,
} from '../../packages/auth/index.ts';

const TEST_SECRET = 'beadsily_super_secure_random_hmac_secret_key_998877';

test('@beadsily/auth Session: Create and verify valid session token', async () => {
  const user = {
    uid: 'user_packer_42',
    role: 'packer',
    email: 'packer@beadsily.com',
    name: 'Pam Packer',
  };

  const token = await createSessionToken(user, TEST_SECRET, 3600);
  assert.ok(token);
  assert.equal(token.split('.').length, 2);

  const verification = await verifySessionToken(token, TEST_SECRET);
  assert.equal(verification.valid, true);
  assert.equal(verification.session.uid, 'user_packer_42');
  assert.equal(verification.session.role, 'packer');
  assert.equal(verification.session.email, 'packer@beadsily.com');
});

test('@beadsily/auth Session: Tampered session token is rejected', async () => {
  const user = { uid: 'user_cust_1', role: 'customer' };
  const token = await createSessionToken(user, TEST_SECRET, 3600);

  // Tamper with payload (elevating role to owner)
  const [payloadEnc, sig] = token.split('.');
  const tamperedPayload = btoa(JSON.stringify({ uid: 'user_cust_1', role: 'owner' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const tamperedToken = `${tamperedPayload}.${sig}`;

  const verification = await verifySessionToken(tamperedToken, TEST_SECRET);
  assert.equal(verification.valid, false);
  assert.equal(verification.error, 'InvalidSessionSignature');
});

test('@beadsily/auth Session: Expired session token is rejected', async () => {
  const user = { uid: 'user_old_1', role: 'customer' };
  // Expired 10 seconds ago (-10 TTL)
  const token = await createSessionToken(user, TEST_SECRET, -10);

  const verification = await verifySessionToken(token, TEST_SECRET);
  assert.equal(verification.valid, false);
  assert.equal(verification.error, 'SessionExpired');
});

test('@beadsily/auth Session: Cookie formatting and extraction', () => {
  const cookieHeader = formatSessionCookie('opaque_token_val_123', 86400, 'Strict');
  assert.match(cookieHeader, /^__Host-beadsily_session=opaque_token_val_123;/);
  assert.match(cookieHeader, /HttpOnly;/);
  assert.match(cookieHeader, /Secure;/);
  assert.match(cookieHeader, /SameSite=Strict;/);

  // Extract from raw header
  const extracted = extractSessionCookie('some_pref=light; __Host-beadsily_session=opaque_token_val_123; other=abc');
  assert.equal(extracted, 'opaque_token_val_123');

  // Clear cookie formatting
  const clearHeader = formatSessionClearCookie();
  assert.match(clearHeader, /Max-Age=0;/);
});

test('@beadsily/auth RBAC: Staff and Owner authorization guards', () => {
  const ownerSession = { uid: 'u_korry', role: 'owner', createdAt: 0, expiresAt: 9999999999 };
  const packerSession = { uid: 'u_dwight', role: 'packer', createdAt: 0, expiresAt: 9999999999 };
  const customerSession = { uid: 'u_alice', role: 'customer', createdAt: 0, expiresAt: 9999999999 };

  // Staff check
  assert.equal(authorizeStaff(ownerSession).authorized, true);
  assert.equal(authorizeStaff(packerSession).authorized, true);
  assert.equal(authorizeStaff(customerSession).authorized, false);
  assert.equal(authorizeStaff(customerSession).status, 403);
  assert.equal(authorizeStaff(null).status, 401);

  // Owner check
  assert.equal(authorizeOwner(ownerSession).authorized, true);
  assert.equal(authorizeOwner(packerSession).authorized, false);
  assert.equal(authorizeOwner(packerSession).status, 403);

  // Action permission checks
  assert.equal(isActionPermitted('packer', 'mark_order_shipped'), true);
  assert.equal(isActionPermitted('packer', 'modify_catalog_pricing'), false);
  assert.equal(isActionPermitted('customer', 'view_own_order'), true);
  assert.equal(isActionPermitted('customer', 'view_packing_lists'), false);
});

test('@beadsily/auth Turnstile: Validation and replay prevention', async () => {
  const replayCache = new InMemoryTurnstileReplayCache();
  const mockFetch = async () => ({
    ok: true,
    json: async () => ({ success: true, hostname: 'beadsily.com' }),
  });

  // 1. Missing token
  const resMissing = await validateTurnstileToken({ token: '', secretKey: 'sec', replayCache });
  assert.equal(resMissing.success, false);
  assert.equal(resMissing.status, 400);

  // 2. Valid token
  const resValid = await validateTurnstileToken({
    token: 'test_turnstile_nonce_123',
    secretKey: 'sec',
    replayCache,
    fetchProvider: mockFetch,
  });
  assert.equal(resValid.success, true);
  assert.equal(resValid.status, 200);

  // 3. Replay attack attempt
  const resReplay = await validateTurnstileToken({
    token: 'test_turnstile_nonce_123',
    secretKey: 'sec',
    replayCache,
    fetchProvider: mockFetch,
  });
  assert.equal(resReplay.success, false);
  assert.equal(resReplay.status, 403);
  assert.equal(resReplay.error, 'TurnstileTokenAlreadyUsed');
});

test('@beadsily/auth Origin: Cross-site and untrusted origin blocking', () => {
  // Sec-Fetch-Site cross-site
  const crossSiteHeaders = new Headers({ 'sec-fetch-site': 'cross-site', origin: 'https://beadsily.com' });
  assert.equal(verifyRequestOrigin(crossSiteHeaders, { isProduction: true }).trusted, false);

  // Trusted production origin
  const prodHeaders = new Headers({ origin: 'https://beadsily.com' });
  assert.equal(verifyRequestOrigin(prodHeaders, { isProduction: true }).trusted, true);

  // Untrusted external origin
  const evilHeaders = new Headers({ origin: 'https://evil-hacker-site.org' });
  assert.equal(verifyRequestOrigin(evilHeaders, { isProduction: true }).trusted, false);
});
