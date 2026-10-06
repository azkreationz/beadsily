import test from 'node:test';
import assert from 'node:assert/strict';
import { isRequestFromTrustedOrigin, createSessionCookieHeader } from './lib/security-modules.mjs';

test('CSRF: Sec-Fetch-Site cross-site request is rejected immediately', () => {
  const headers = {
    'sec-fetch-site': 'cross-site',
    origin: 'https://beadsily.com',
  };
  const result = isRequestFromTrustedOrigin(headers, true);
  assert.equal(result.trusted, false);
  assert.match(result.reason, /Sec-Fetch-Site policy/);
});

test('CSRF: Same-origin production request is accepted', () => {
  const headers = {
    'sec-fetch-site': 'same-origin',
    origin: 'https://beadsily.com',
  };
  const result = isRequestFromTrustedOrigin(headers, true);
  assert.equal(result.trusted, true);
});

test('CSRF: www subdomain of canonical domain is accepted', () => {
  const headers = {
    'sec-fetch-site': 'same-origin',
    origin: 'https://www.beadsily.com',
  };
  const result = isRequestFromTrustedOrigin(headers, true);
  assert.equal(result.trusted, true);
});

test('CSRF: Malicious third-party origin is blocked', () => {
  const headers = {
    'sec-fetch-site': 'same-site',
    origin: 'https://malicious-craft-site.com',
  };
  const result = isRequestFromTrustedOrigin(headers, true);
  assert.equal(result.trusted, false);
  assert.match(result.reason, /Untrusted origin host/);
});

test('CSRF: Subdomain spoofing attack (attacker-beadsily.com) is blocked', () => {
  const headers = {
    origin: 'https://beadsily.com.attacker.org',
  };
  const result = isRequestFromTrustedOrigin(headers, true);
  assert.equal(result.trusted, false);
});

test('CSRF: Development origins accepted only in non-production mode', () => {
  const devHeaders = {
    origin: 'http://localhost:3000',
  };

  // Accepted in development
  const devResult = isRequestFromTrustedOrigin(devHeaders, false);
  assert.equal(devResult.trusted, true);

  // Rejected in production mode
  const prodResult = isRequestFromTrustedOrigin(devHeaders, true);
  assert.equal(prodResult.trusted, false);
});

test('CSRF: Missing origin and referer on mutation request is blocked', () => {
  const headers = {};
  const result = isRequestFromTrustedOrigin(headers, true);
  assert.equal(result.trusted, false);
  assert.match(result.reason, /Missing valid Origin or Referer/);
});

test('Cookie Policy: Session cookies enforce HttpOnly, Secure, SameSite, and __Host- prefix', () => {
  const header = createSessionCookieHeader('sess_crypto_random_12345');
  assert.match(header, /^__Host-beadsily_session=sess_crypto_random_12345;/);
  assert.match(header, /HttpOnly;/);
  assert.match(header, /Secure;/);
  assert.match(header, /SameSite=Lax;/);
  assert.match(header, /Path=\/;/);
  assert.match(header, /Max-Age=604800/);
});
