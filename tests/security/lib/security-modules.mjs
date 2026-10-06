/**
 * BeadsILY Security Reference Implementations & Verification Helpers
 * Clean-room implementation matching THREAT-MODEL.md specifications.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

// ---------------------------------------------------------------------------
// 1. Staff RBAC Permission Matrix & Guard
// ---------------------------------------------------------------------------

export const STAFF_ROLES = ['owner', 'packer', 'support', 'auditor'];
export const ALL_ROLES = [...STAFF_ROLES, 'customer', 'anonymous'];

export const ROLE_PERMISSIONS = {
  browse_catalog: ['anonymous', 'customer', 'packer', 'support', 'auditor', 'owner'],
  create_cart_reservation: ['anonymous', 'customer', 'owner'],
  execute_checkout: ['anonymous', 'customer', 'owner'],
  view_own_order: ['customer', 'owner'],
  manage_own_subscription: ['customer', 'owner'],
  view_packing_lists: ['packer', 'support', 'auditor', 'owner'],
  mark_order_shipped: ['packer', 'support', 'owner'],
  record_component_intake: ['packer', 'owner'],
  update_shipping_address: ['support', 'owner'],
  issue_refund: ['support', 'owner'],
  modify_catalog_pricing: ['owner'],
  modify_bom_recipes: ['owner'],
  view_movement_ledger: ['auditor', 'owner'],
  view_financial_metrics: ['owner'],
  manage_staff_accounts: ['owner'],
};

/**
 * Evaluates whether a given role is authorized to perform an action.
 */
export function checkRbacPermission(userRole, action) {
  if (!userRole || !ALL_ROLES.includes(userRole)) {
    return { allowed: false, reason: 'Invalid or missing user role.' };
  }
  const allowedRoles = ROLE_PERMISSIONS[action];
  if (!allowedRoles) {
    return { allowed: false, reason: `Unknown system action: ${action}` };
  }
  if (!allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      reason: `Role '${userRole}' is not permitted to perform '${action}'.`,
    };
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// 2. IDOR Prevention & Order Access Guard
// ---------------------------------------------------------------------------

/**
 * Enforces ownership check on customer order access.
 * Staff roles (owner, support) can access for customer care; customers can only access their own.
 */
export function verifyOrderAccess(session, order) {
  if (!order || typeof order !== 'object') {
    return { allowed: false, status: 404, reason: 'Order not found.' };
  }

  // Unauthenticated visitors
  if (!session) {
    return { allowed: false, status: 401, reason: 'Authentication required.' };
  }

  // Staff elevated review mode
  if (session.role === 'owner' || session.role === 'support') {
    return { allowed: true, accessType: 'staff_support' };
  }

  // Packers can only see packaging/shipping fields, not financial billing metadata
  if (session.role === 'packer') {
    return {
      allowed: true,
      accessType: 'packer_view',
      sanitizedOrder: {
        orderId: order.id,
        status: order.status,
        shippingAddress: order.shippingAddress,
        items: order.items,
        packingChecklist: order.packingChecklist,
      },
    };
  }

  // Customer self-ownership check
  if (session.role === 'customer' || session.uid) {
    if (order.customerId && order.customerId === session.uid) {
      return { allowed: true, accessType: 'customer_owner' };
    }
  }

  // Guest order access via secure token verification
  if (session.guestAccessToken && order.guestAccessToken) {
    const bufA = Buffer.from(session.guestAccessToken);
    const bufB = Buffer.from(order.guestAccessToken);
    if (bufA.length === bufB.length && timingSafeEqual(bufA, bufB)) {
      return { allowed: true, accessType: 'guest_verified' };
    }
  }

  // Access denied to any other user
  return { allowed: false, status: 403, reason: 'Access denied: You do not own this order.' };
}

// ---------------------------------------------------------------------------
// 3. CSRF & Origin Enforcement Guard
// ---------------------------------------------------------------------------

const PROD_ALLOWED_HOSTNAMES = new Set(['beadsily.com', 'www.beadsily.com']);
const DEV_ALLOWED_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

function extractHostname(urlString) {
  if (!urlString) return null;
  try {
    return new URL(urlString).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Validates request origin against allowed hostnames and checks Sec-Fetch-Site.
 */
export function isRequestFromTrustedOrigin(headers, isProduction = false) {
  // Layer 1: Sec-Fetch-Site (browser unforgeable)
  const secFetchSite = headers.get ? headers.get('sec-fetch-site') : headers['sec-fetch-site'];
  if (secFetchSite === 'cross-site') {
    return { trusted: false, reason: 'Cross-site request blocked by Sec-Fetch-Site policy.' };
  }

  // Layer 2: Origin or Referer header verification
  const origin = headers.get ? headers.get('origin') : headers['origin'];
  const referer = headers.get ? headers.get('referer') : headers['referer'];

  const targetHost = extractHostname(origin) || extractHostname(referer);

  if (!targetHost) {
    return { trusted: false, reason: 'Missing valid Origin or Referer header on mutation request.' };
  }

  if (PROD_ALLOWED_HOSTNAMES.has(targetHost)) {
    return { trusted: true };
  }

  if (!isProduction && DEV_ALLOWED_HOSTNAMES.has(targetHost)) {
    return { trusted: true };
  }

  return { trusted: false, reason: `Untrusted origin host: ${targetHost}` };
}

// ---------------------------------------------------------------------------
// 4. Cloudflare Turnstile Server-Side Verification Mock/Helper
// ---------------------------------------------------------------------------

/**
 * Ephemeral memory store for used Turnstile tokens to demonstrate replay prevention.
 */
export class EphemeralTokenStore {
  constructor() {
    this.usedTokens = new Map();
  }

  has(token) {
    this.purgeExpired();
    return this.usedTokens.has(token);
  }

  add(token, ttlMs = 300000) {
    this.usedTokens.set(token, Date.now() + ttlMs);
  }

  purgeExpired() {
    const now = Date.now();
    for (const [token, expiry] of this.usedTokens.entries()) {
      if (now > expiry) {
        this.usedTokens.delete(token);
      }
    }
  }
}

/**
 * Server-side Turnstile verification handler with replay and expiration defenses.
 */
export async function verifyTurnstileToken({
  token,
  clientIp,
  secretKey,
  tokenStore,
  mockFetchProvider = null,
}) {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return { success: false, status: 400, error: 'MissingTurnstileToken' };
  }

  // Replay Attack Defense
  if (tokenStore && tokenStore.has(token)) {
    return {
      success: false,
      status: 403,
      error: 'TurnstileTokenAlreadyUsed',
      reason: 'Token has already been consumed and cannot be replayed.',
    };
  }

  // Invoke siteverify provider (in tests, mockFetchProvider simulates Cloudflare's endpoint)
  const fetchFn = mockFetchProvider || fetch;
  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', token);
  if (clientIp) formData.append('remoteip', clientIp);

  try {
    const res = await fetchFn('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    const data = await res.json();
    if (!data.success) {
      return {
        success: false,
        status: 403,
        error: 'TurnstileVerificationFailed',
        details: data['error-codes'] || [],
      };
    }

    // Mark token as consumed
    if (tokenStore) {
      tokenStore.add(token);
    }

    return { success: true };
  } catch (err) {
    return { success: false, status: 502, error: 'TurnstileServiceError', message: err.message };
  }
}

// ---------------------------------------------------------------------------
// 5. Stripe Webhook Signature & Idempotency
// ---------------------------------------------------------------------------

/**
 * Cryptographically verifies Stripe webhook HMAC-SHA256 signature against raw body.
 */
export function verifyStripeWebhookSignature(rawBody, signatureHeader, secret, toleranceSeconds = 300) {
  if (!signatureHeader || !secret) {
    return { valid: false, reason: 'Missing signature header or webhook secret.' };
  }

  // Stripe signature format: t=timestamp,v1=signature,v0=...
  const parts = signatureHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

  const timestamp = parseInt(parts.t, 10);
  const v1Signature = parts.v1;

  if (isNaN(timestamp) || !v1Signature) {
    return { valid: false, reason: 'Malformed stripe-signature header.' };
  }

  // Timestamp tolerance check (defense against replay)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > toleranceSeconds) {
    return { valid: false, reason: 'Webhook signature timestamp outside tolerance window.' };
  }

  // Compute expected HMAC-SHA256
  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedHmac = createHmac('sha256', secret).update(signedPayload).digest('hex');

  // Constant-time comparison
  const expectedBuffer = Buffer.from(expectedHmac, 'hex');
  const actualBuffer = Buffer.from(v1Signature, 'hex');

  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    return { valid: false, reason: 'HMAC signature verification failed.' };
  }

  return { valid: true, timestamp };
}

// ---------------------------------------------------------------------------
// 6. Price Calculation & Client Price Tampering Defense (PAY-01)
// ---------------------------------------------------------------------------

/**
 * Calculates authoritative order total from approved server catalog.
 * Completely ignores any client-supplied unit amounts or discounts.
 */
export function computeAuthoritativeOrderTotal(clientOrder, catalog) {
  let subtotalMinor = 0;

  for (const item of clientOrder.items) {
    const catalogProduct = catalog[item.productId];
    if (!catalogProduct) {
      throw new Error(`Product not found in catalog: ${item.productId}`);
    }

    if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new Error(`Invalid item quantity: ${item.quantity}`);
    }

    let itemPriceMinor = catalogProduct.basePriceMinor;

    // For 15-guest kits, calculate additional guests
    if (catalogProduct.isPartyKit) {
      const guestCount = item.guestCount || 15;
      if (guestCount < 15) {
        throw new Error('Party kit minimum guest count is 15.');
      }
      const additionalGuests = guestCount - 15;
      itemPriceMinor += additionalGuests * (catalogProduct.additionalGuestFeeMinor || 1200);
    }

    subtotalMinor += itemPriceMinor * item.quantity;
  }

  const shippingMinor = subtotalMinor >= 10000 ? 0 : 995; // Free shipping over $100
  const taxMinor = Math.round(subtotalMinor * 0.086); // 8.6% AZ sales tax rate

  return {
    subtotalMinor,
    shippingMinor,
    taxMinor,
    totalMinor: subtotalMinor + shippingMinor + taxMinor,
    currency: 'usd',
  };
}

// ---------------------------------------------------------------------------
// 7. Privacy, COPPA & Log Redaction
// ---------------------------------------------------------------------------

/**
 * Sanitizes log objects by scrubbing PANs, emails, and sensitive personal details.
 */
export function scrubPiiFromLogs(data) {
  if (!data || typeof data !== 'object') return data;

  const serialized = JSON.stringify(data);

  // Redact 13-19 digit card numbers
  const sanitized = serialized
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED_PAN]')
    // Redact email addresses
    .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, (email) => {
      const parts = email.split('@');
      return `${parts[0].slice(0, 1)}***@${parts[1]}`;
    })
    // Redact CVV (3-4 digits labeled cvv)
    .replace(/"cvv"\s*:\s*"\d{3,4}"/gi, '"cvv":"[REDACTED]"');

  return JSON.parse(sanitized);
}

/**
 * Escapes CSV cell values to prevent spreadsheet formula injection (=, +, -, @).
 */
export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/^[=+\-@\t\r]/.test(stringValue)) {
    return `'${stringValue}`;
  }
  return stringValue;
}

// ---------------------------------------------------------------------------
// 8. Secure Cookie Header Generator
// ---------------------------------------------------------------------------

export function createSessionCookieHeader(sessionId, maxAgeSeconds = 604800) {
  return `__Host-beadsily_session=${sessionId}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}
