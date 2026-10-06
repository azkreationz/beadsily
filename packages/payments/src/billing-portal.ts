export interface BillingPortalParams {
  stripeClient: any;
  authenticatedUser: {
    id: string;
    role?: string;
    customerId?: string;
    [key: string]: any;
  };
  targetCustomerId: string;
  returnUrl?: string;
}

export interface BillingPortalResult {
  url: string;
  sessionId: string;
}

export { createBillingPortalSession } from './billing-portal.mjs';
