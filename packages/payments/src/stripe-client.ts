export interface StripeSessionParams {
  ui_mode?: 'embedded' | 'hosted';
  mode?: 'payment' | 'subscription' | 'setup';
  line_items?: Array<{
    price_data: {
      currency: string;
      product_data: {
        name: string;
        description?: string;
        metadata?: Record<string, string>;
      };
      unit_amount: number;
    };
    quantity: number;
  }>;
  customer_email?: string;
  client_reference_id?: string;
  metadata?: Record<string, string>;
  return_url?: string;
  [key: string]: any;
}

export { MockStripeClient, createStripeClient } from './stripe-client.mjs';
