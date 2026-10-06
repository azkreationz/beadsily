/**
 * BeadsILY Transactional Email Template: Shipping & Tracking Notification
 * Requirement: EMAIL-02
 * Copy & Design: Marisol (marisol-muwiha89)
 */

export function renderOrderShipped(data = {}) {
  const customerFirstName = data.customerFirstName || 'Craft Host';
  const orderNumber = data.orderNumber || '0000';
  const carrierName = data.carrierName || 'USPS Priority Mail';
  const trackingNumber = data.trackingNumber || '9400111899562537624000';
  const trackingUrl = data.trackingUrl || `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
  const estimatedDeliveryDate = data.estimatedDeliveryDate || 'in 2–3 business days';
  const hostGuideUrl = data.hostGuideUrl || 'https://beadsily.com/guides/host-master-guide-15-guest.pdf';

  const subject = `Your BeadsILY Kit has shipped! Track Order #${orderNumber}`;
  const preheader = `Your party supplies are on the way via ${carrierName}. Tracking: ${trackingNumber}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your BeadsILY Order Has Shipped</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #faf5ff; color: #2d3748; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f472b6, #c084fc); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1a202c; }
    .tracking-card { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin: 24px 0; }
    .checklist { background-color: #fdf4ff; border: 1px solid #f5d0fe; border-radius: 8px; padding: 18px; margin: 24px 0; }
    .checklist-item { margin-bottom: 10px; font-size: 14px; }
    .button-wrap { text-align: center; margin: 28px 0; }
    .cta-button { background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; }
    .footer { background-color: #f3f4f6; padding: 24px; text-align: center; font-size: 13px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BeadsILY Craft Studio</h1>
    </div>
    <div class="content">
      <div class="greeting">Exciting news, ${customerFirstName}!</div>
      <p>Your BeadsILY Party Kit has been carefully hand-packed and dispatched from our studio.</p>

      <div class="tracking-card">
        <h3 style="margin-top:0; color:#15803d;">Shipment &amp; Tracking Information</h3>
        <p><strong>Order Number:</strong> #${orderNumber}</p>
        <p><strong>Carrier:</strong> ${carrierName}</p>
        <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
        <p><strong>Estimated Arrival:</strong> ${estimatedDeliveryDate}</p>
        <div class="button-wrap" style="margin: 16px 0 8px 0;">
          <a href="${trackingUrl}" class="cta-button">Track Package on Carrier Site</a>
        </div>
      </div>

      <div class="checklist">
        <h3 style="margin-top:0; color:#7e22ce;">Host Pre-Party 3-Minute Checklist</h3>
        <div class="checklist-item"><strong>1. Clear your table space:</strong> Ensure comfortable seating for your crafters with good lighting.</div>
        <div class="checklist-item"><strong>2. Designate bead sorting zones:</strong> We include 2 anti-roll sorting trays—place one between every 7–8 seats.</div>
        <div class="checklist-item"><strong>3. Review the 75-minute timeline:</strong> Check out the 3 craft milestones in your Host Master Guide.</div>
      </div>

      <p style="text-align:center;">
        <a href="${hostGuideUrl}" style="color:#9333ea; font-weight:600; text-decoration:underline;">View Digital Host Master Guide &amp; Timeline</a>
      </p>
    </div>
    <div class="footer">
      <p>Have questions about delivery? Reply to this email or reach us at <a href="mailto:help@beadsily.com" style="color:#9333ea;">help@beadsily.com</a>.</p>
      <p>&copy; 2026 BeadsILY. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `==================================================
BEADSILY CRAFT STUDIO — YOUR ORDER HAS SHIPPED!
==================================================

Exciting news, ${customerFirstName}!

Your BeadsILY Party Kit has been carefully hand-packed and dispatched from our studio.

SHIPMENT & TRACKING DETAILS:
- Order Number: #${orderNumber}
- Carrier: ${carrierName}
- Tracking Number: ${trackingNumber}
- Tracking URL: ${trackingUrl}
- Estimated Arrival: ${estimatedDeliveryDate}

HOST PRE-PARTY 3-MINUTE CHECKLIST:
1. Clear your table space: Ensure comfortable seating for your crafters with good lighting.
2. Designate bead sorting zones: Place 1 anti-roll tray between every 7–8 seats.
3. Review the 75-minute timeline: Familiarize yourself with the 3 projects in the Host Master Guide.

DIGITAL HOST MASTER GUIDE:
${hostGuideUrl}

Need assistance? Email help@beadsily.com.
Happy Crafting!
`;

  return {
    subject,
    preheader,
    html,
    text
  };
}
