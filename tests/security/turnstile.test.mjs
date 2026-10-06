import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyTurnstileToken, EphemeralTokenStore } from './lib/security-modules.mjs';

function createMockFetch(expectedOutcome = { success: true }) {
  return async (_url, options) => {
    return {
      ok: true,
      json: async () => expectedOutcome,
    };
  };
}

test('Turnstile: Missing or blank token is rejected immediately (HTTP 400)', async () => {
  const store = new EphemeralTokenStore();
  const res1 = await verifyTurnstileToken({ token: '', clientIp: '1.2.3.4', secretKey: 'sec', tokenStore: store });
  assert.equal(res1.success, false);
  assert.equal(res1.status, 400);
  assert.equal(res1.error, 'MissingTurnstileToken');

  const res2 = await verifyTurnstileToken({ token: null, clientIp: '1.2.3.4', secretKey: 'sec', tokenStore: store });
  assert.equal(res2.success, false);
  assert.equal(res2.status, 400);
});

test('Turnstile: Valid fresh token succeeds and is marked as used', async () => {
  const store = new EphemeralTokenStore();
  const mockFetch = createMockFetch({ success: true });

  const res = await verifyTurnstileToken({
    token: 'valid_turnstile_token_1001',
    clientIp: '198.51.100.1',
    secretKey: '0x4AAAAAA_SECRET',
    tokenStore: store,
    mockFetchProvider: mockFetch,
  });

  assert.equal(res.success, true);
  assert.equal(store.has('valid_turnstile_token_1001'), true, 'Token must be recorded in store');
});

test('Turnstile: Replay attack (using same token twice) is blocked (HTTP 403)', async () => {
  const store = new EphemeralTokenStore();
  const mockFetch = createMockFetch({ success: true });

  // First attempt succeeds
  const firstAttempt = await verifyTurnstileToken({
    token: 'replayed_token_2002',
    clientIp: '198.51.100.2',
    secretKey: '0x4AAAAAA_SECRET',
    tokenStore: store,
    mockFetchProvider: mockFetch,
  });
  assert.equal(firstAttempt.success, true);

  // Second attempt with exact same token must fail
  const secondAttempt = await verifyTurnstileToken({
    token: 'replayed_token_2002',
    clientIp: '198.51.100.2',
    secretKey: '0x4AAAAAA_SECRET',
    tokenStore: store,
    mockFetchProvider: mockFetch,
  });

  assert.equal(secondAttempt.success, false);
  assert.equal(secondAttempt.status, 403);
  assert.equal(secondAttempt.error, 'TurnstileTokenAlreadyUsed');
  assert.match(secondAttempt.reason, /already been consumed/);
});

test('Turnstile: Upstream Cloudflare verification failure is returned with error code', async () => {
  const store = new EphemeralTokenStore();
  const mockFetch = createMockFetch({
    success: false,
    'error-codes': ['invalid-input-response', 'timeout-or-duplicate'],
  });

  const res = await verifyTurnstileToken({
    token: 'forged_or_invalid_token',
    clientIp: '198.51.100.3',
    secretKey: '0x4AAAAAA_SECRET',
    tokenStore: store,
    mockFetchProvider: mockFetch,
  });

  assert.equal(res.success, false);
  assert.equal(res.status, 403);
  assert.equal(res.error, 'TurnstileVerificationFailed');
  assert.deepEqual(res.details, ['invalid-input-response', 'timeout-or-duplicate']);
});

test('Turnstile: Token store correctly purges expired nonces', async () => {
  const store = new EphemeralTokenStore();
  store.add('fast_expiring_token', 10); // 10 ms TTL

  assert.equal(store.has('fast_expiring_token'), true);

  // Wait 25 ms
  await new Promise((r) => setTimeout(r, 25));

  assert.equal(store.has('fast_expiring_token'), false);
});
