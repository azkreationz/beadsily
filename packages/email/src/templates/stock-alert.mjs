/**
 * BeadsILY Operational Email Template: Stock Alert
 * Requirement: INV-02, INV-06, EMAIL-02
 * Triggered when available stock falls below safety stock buffer
 */

export function renderStockAlert(data = {}) {
  const componentSku = data.componentSku || 'CMP-UNKNOWN';
  const componentName = data.componentName || 'Component';
  const stockOnHand = Number(data.stockOnHand ?? 0);
  const stockReserved = Number(data.stockReserved ?? 0);
  const safetyStock = Number(data.safetyStock ?? 0);
  const available = stockOnHand - stockReserved;
  const binLocation = data.binLocation || 'Aisle 1-A';
  const reorderPoint = data.reorderPoint || (safetyStock * 2);

  const subject = `[INVENTORY ALERT] Low Stock Threshold Reached: ${componentSku}`;
  const preheader = `Available stock (${available}) is below safety threshold (${safetyStock}) for ${componentName}.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>BeadsILY Inventory Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fef2f2; color: #1f2937; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #fecaca; overflow: hidden; }
    .header { background: #dc2626; color: #ffffff; padding: 20px; text-align: center; }
    .header h2 { margin: 0; }
    .content { padding: 24px; }
    .metric-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .metric-table th, .metric-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    .metric-table th { background-color: #f9fafb; font-size: 13px; color: #6b7280; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; background: #fee2e2; color: #991b1b; }
    .footer { background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⚠️ Inventory Safety Threshold Alert</h2>
    </div>
    <div class="content">
      <p>Attention Inventory Operations Team,</p>
      <p>The following component has reached or fallen below its required safety stock buffer in Cloudflare D1 authoritative inventory:</p>
      
      <table class="metric-table">
        <tr><th>SKU</th><td><strong>${componentSku}</strong></td></tr>
        <tr><th>Component Name</th><td>${componentName}</td></tr>
        <tr><th>Physical Bin Location</th><td>${binLocation}</td></tr>
        <tr><th>Stock On Hand</th><td>${stockOnHand} units</td></tr>
        <tr><th>Active Reservations</th><td>${stockReserved} units</td></tr>
        <tr><th>Available to Promise</th><td><span class="badge">${available} units</span></td></tr>
        <tr><th>Safety Stock Buffer</th><td>${safetyStock} units</td></tr>
        <tr><th>Recommended Reorder Qty</th><td>${reorderPoint} units</td></tr>
      </table>

      <p><strong>Action Required:</strong> Please initiate procurement or replenishment intake to prevent assembly stoppages and atomic reservation rollbacks for upcoming orders.</p>
    </div>
    <div class="footer">
      Automated Operational Notification &bull; BeadsILY Studio &bull; D1 Authoritative Ledger
    </div>
  </div>
</body>
</html>`;

  const text = `==================================================
⚠️ BEADSILY INVENTORY SAFETY THRESHOLD ALERT
==================================================

Attention Inventory Operations Team,

The following component has fallen below its required safety stock buffer:

- Component SKU: ${componentSku}
- Component Name: ${componentName}
- Bin Location: ${binLocation}
- Stock On Hand: ${stockOnHand} units
- Active Reservations: ${stockReserved} units
- Available to Promise: ${available} units
- Safety Stock Threshold: ${safetyStock} units
- Recommended Reorder Qty: ${reorderPoint} units

ACTION REQUIRED: Initiate replenishment intake to prevent atomic reservation rollbacks.

--
Automated Operational Notification | BeadsILY D1 Authoritative Ledger
`;

  return {
    subject,
    preheader,
    html,
    text
  };
}
