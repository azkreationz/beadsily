/**
 * BeadsILY Transactional Email Template: Replacement Dispatch Notification
 * Requirement: EMAIL-02, INV-08, KIT-ERR-01, MYS-ERR-01
 * Copy & Design: Marisol (marisol-muwiha89)
 */

export function renderReplacementDispatched(data = {}) {
  const customerName = data.customerName || 'Valued Crafter';
  const ticketId = data.ticketId || 'TKT-0000';
  const carrierName = data.carrierName || 'USPS Priority Mail';
  const trackingNumber = data.trackingNumber || '9400111899562537624999';
  const trackingUrl = data.trackingUrl || `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
  const items = Array.isArray(data.items) && data.items.length > 0 ? data.items : [
    { name: 'Replacement Focal Charm Bead', quantity: 1 }
  ];

  const subject = `Your BeadsILY Replacement Packet is on its way! (Ref: #${ticketId})`;
  const preheader = `We've rushed your replacement supplies via ${carrierName}. Tracking inside.`;

  const itemsHtml = items.map(item => `<li><strong>${item.quantity}x</strong> ${item.name}</li>`).join('');
  const itemsText = items.map(item => `- ${item.quantity}x ${item.name}`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>BeadsILY Replacement Dispatched</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf5ff; color: #2d3748; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #f3e8ff; overflow: hidden; }
    .header { background: #9333ea; color: #ffffff; padding: 24px; text-align: center; }
    .content { padding: 24px; }
    .box { background: #fdf4ff; border: 1px solid #f5d0fe; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .cta-button { background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; }
    .footer { background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;">Replacement Packet Dispatched</h2>
    </div>
    <div class="content">
      <p>Hello ${customerName},</p>
      <p>We are so sorry again for the damaged or missing piece! Your replacement supplies have been packed with care and rushed out the door at zero cost to you.</p>

      <div class="box">
        <h3 style="margin-top:0; color:#7e22ce;">Enclosed Supplies:</h3>
        <ul style="margin:0; padding-left:20px;">
          ${itemsHtml}
        </ul>
      </div>

      <p><strong>Carrier:</strong> ${carrierName}<br/>
      <strong>Tracking Number:</strong> ${trackingNumber}</p>

      <div style="text-align:center; margin: 20px 0;">
        <a href="${trackingUrl}" class="cta-button">Track Replacement Packet</a>
      </div>

      <p style="font-size:14px; color:#6b7280;"><em>Tip: Remember to check your kit's gold Host Spare Supply Envelope for additional backup elastic, clasps, and beads!</em></p>
    </div>
    <div class="footer">
      Support Ticket Ref #${ticketId} &bull; BeadsILY Customer Care
    </div>
  </div>
</body>
</html>`;

  const text = `==================================================
BEADSILY REPLACEMENT DISPATCHED — Ref: #${ticketId}
==================================================

Hello ${customerName},

Your replacement supplies have been packed and rushed to you at zero cost!

ENCLOSED SUPPLIES:
${itemsText}

TRACKING DETAILS:
Carrier: ${carrierName}
Tracking: ${trackingNumber}
URL: ${trackingUrl}

Tip: Check your kit's Host Spare Supply Envelope for extra backups!

Warmly,
The BeadsILY Customer Care Team
`;

  return {
    subject,
    preheader,
    html,
    text
  };
}
