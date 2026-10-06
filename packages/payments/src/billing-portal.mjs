/**
 * BeadsILY Stripe Customer Portal & IDOR Defense (@beadsily/payments)
 * Compliant with: PAY-05, SEC-01, SEC-02
 * Author: Angela (angela-muwif3s4), Commercial Payments & Subscription Lead
 */

const TRUSTED_RETURN_ORIGINS = [
  'https://beadsily.com',
  'https://www.beadsily.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

/**
 * Creates an authenticated Stripe Customer Billing Portal session.
 * Protects against IDOR (Insecure Direct Object Reference) and Open Redirect vulnerabilities (PAY-05).
 *
 * @param {Object} params
 * @param {Object} params.stripeClient Stripe client instance
 * @param {Object} params.authenticatedUser User object { id, role, customerId? }
 * @param {string} params.targetCustomerId Customer ID requested to manage
 * @param {string} [params.returnUrl='https://beadsily.com/account'] Trusted return URL
 * @returns {Promise<{ url: string, sessionId: string }>} Portal session URL
 */
export async function createBillingPortalSession({
  stripeClient,
  authenticatedUser,
  targetCustomerId,
  returnUrl = 'https://beadsily.com/account',
}) {
  if (!authenticatedUser || !authenticatedUser.id) {
    const err = new Error('UNAUTHORIZED: Authentication required to access billing portal');
    err.status = 401;
    throw err;
  }

  // IDOR Defense (PAY-05)
  // Non-staff users can only access their own customer billing portal
  const isStaff = authenticatedUser.role === 'owner' || authenticatedUser.role === 'admin' || authenticatedUser.role === 'support';
  const isOwnerOfRecord = authenticatedUser.id === targetCustomerId || authenticatedUser.customerId === targetCustomerId;

  if (!isStaff && !isOwnerOfRecord) {
    const err = new Error('FORBIDDEN_IDOR: Cannot access billing portal for another customer');
    err.status = 403;
    throw err;
  }

  // Return URL Validation (Open Redirect Defense)
  try {
    const parsed = new URL(returnUrl);
    if (!TRUSTED_RETURN_ORIGINS.includes(parsed.origin)) {
      throw new Error(`UNTRUSTED_RETURN_URL: Origin ${parsed.origin} not in allowlist`);
    }
  } catch (urlErr) {
    throw new Error(`INVALID_RETURN_URL: ${urlErr.message}`);
  }

  const portalSession = await stripeClient.billingPortal.sessions.create({
    customer: targetCustomerId,
    return_url: returnUrl,
  });

  return {
    url: portalSession.url,
    sessionId: portalSession.id,
  };
}
