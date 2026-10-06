import type { OrderItemInput, AuthoritativeOrderTotal } from './pricing.js';

export interface EmbeddedCheckoutParams {
  db: any;
  stripeClient: any;
  cart: {
    items: OrderItemInput[];
  };
  customerEmail: string;
  shippingAddress?: any;
  origin?: string;
}

export interface EmbeddedCheckoutResult {
  clientSecret: string;
  sessionId: string;
  sessionToken: string;
  orderId: string;
  orderNumber: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  verifiedItems: any[];
}

export { createEmbeddedCheckoutSession } from './checkout-session.mjs';
