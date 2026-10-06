export interface WebhookHandlerParams {
  db: any;
  rawBody: string;
  signatureHeader: string;
  secret: string;
}

export interface WebhookHandlerResult {
  status: number;
  message: string;
  deduplicated?: boolean;
  eventId?: string;
}

export { verifyStripeWebhookSignature, handleStripeWebhookEvent } from './webhook-handler.mjs';
