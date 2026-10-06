/**
 * BeadsILY Transactional Email Templates Aggregator & Factory
 */

import { renderOrderConfirmation } from './order-confirmation.mjs';
import { renderOrderShipped } from './order-shipped.mjs';
import { renderStockAlert } from './stock-alert.mjs';
import { renderSupportAcknowledgment } from './support-acknowledgment.mjs';
import { renderMonthlyDrop } from './monthly-drop.mjs';
import { renderReplacementDispatched } from './replacement-dispatched.mjs';

export {
  renderOrderConfirmation,
  renderOrderShipped,
  renderStockAlert,
  renderSupportAcknowledgment,
  renderMonthlyDrop,
  renderReplacementDispatched
};

const TEMPLATE_REGISTRY = {
  'order_confirmation': renderOrderConfirmation,
  'order-confirmation': renderOrderConfirmation,
  'order_shipped': renderOrderShipped,
  'order-shipped': renderOrderShipped,
  'stock_alert': renderStockAlert,
  'stock-alert': renderStockAlert,
  'support_acknowledgment': renderSupportAcknowledgment,
  'support-acknowledgment': renderSupportAcknowledgment,
  'monthly_drop': renderMonthlyDrop,
  'monthly-drop': renderMonthlyDrop,
  'replacement_dispatched': renderReplacementDispatched,
  'replacement-dispatched': renderReplacementDispatched
};

/**
 * Render any registered template by name.
 * @param {string} templateName
 * @param {object} data
 * @returns {{ subject: string, preheader: string, html: string, text: string }}
 */
export function renderTemplate(templateName, data = {}) {
  const renderer = TEMPLATE_REGISTRY[templateName];
  if (!renderer) {
    throw new Error(`UNKNOWN_TEMPLATE: No email template registered under name "${templateName}"`);
  }
  return renderer(data);
}

export function listSupportedTemplates() {
  return Object.keys(TEMPLATE_REGISTRY);
}
