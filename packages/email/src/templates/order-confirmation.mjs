/**
 * BeadsILY Transactional Email Template: Order Confirmation
 * Requirement: EMAIL-02, CAT-01 (Truthful 45-project accounting for 15 guests)
 * Copy & Design: Marisol (marisol-muwiha89)
 */

export function renderOrderConfirmation(data = {}) {
  const customerFirstName = data.customerFirstName || 'Craft Host';
  const orderNumber = data.orderNumber || '0000';
  const productTitle = data.productTitle || 'BeadsILY 15-Guest Deluxe Craft Party Kit';
  const guestCount = Number(data.guestCount) || 15;
  const totalProjectCount = Number(data.totalProjectCount) || (guestCount * 3);
  const themeName = data.themeName || 'Signature Assortment';
  const totalAmountDollars = data.totalAmountDollars || (data.totalAmountCents ? (data.totalAmountCents / 100).toFixed(2) : '89.00');
  
  const shippingName = data.shippingName || (data.shippingAddress?.name || customerFirstName);
  const shippingStreet = data.shippingStreet || (data.shippingAddress?.street || '123 Main St');
  const shippingCity = data.shippingCity || (data.shippingAddress?.city || 'Phoenix');
  const shippingState = data.shippingState || (data.shippingAddress?.state || 'AZ');
  const shippingZip = data.shippingZip || (data.shippingAddress?.zip || '85001');

  const hostGuideUrl = data.hostGuideUrl || 'https://beadsily.com/guides/host-master-guide-15-guest.pdf';
  const estimatedDeliveryRange = data.estimatedDeliveryRange || '3–5 business days';

  const subject = `Your BeadsILY Craft Party is on its way! Order #${orderNumber}`;
  const preheader = `Get ready to craft ${totalProjectCount} keepsakes! View your order details and host guide inside.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your BeadsILY Order Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #faf5ff; color: #2d3748; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f472b6, #c084fc); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1a202c; }
    .summary-card { background-color: #fdf4ff; border: 1px solid #f5d0fe; border-radius: 8px; padding: 18px; margin: 24px 0; }
    .project-breakdown { margin: 20px 0; }
    .project-item { display: flex; align-items: center; margin-bottom: 10px; font-size: 15px; }
    .project-icon { font-size: 20px; margin-right: 12px; }
    .button-wrap { text-align: center; margin: 32px 0; }
    .cta-button { background-color: #9333ea; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; }
    .footer { background-color: #f3f4f6; padding: 24px; text-align: center; font-size: 13px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BeadsILY Craft Studio</h1>
    </div>
    <div class="content">
      <div class="greeting">Woohoo, ${customerFirstName}! Your craft celebration is official.</div>
      <p>Thank you for choosing BeadsILY. We are hand-packing your order and preparing your premium supplies for an unforgettable gathering.</p>
      
      <div class="summary-card">
        <h3 style="margin-top:0; color:#7e22ce;">Order Summary #${orderNumber}</h3>
        <p><strong>Party Package:</strong> ${productTitle} (${guestCount} Guests)</p>
        <p><strong>Guaranteed Output:</strong> ${totalProjectCount} Finished Keepsake Projects</p>
        <p><strong>Theme Selected:</strong> ${themeName}</p>
        <p><strong>Total Paid:</strong> $${totalAmountDollars} via Stripe</p>
        <p><strong>Shipping Address:</strong><br/>${shippingName}<br/>${shippingStreet}<br/>${shippingCity}, ${shippingState} ${shippingZip}</p>
      </div>

      <div class="project-breakdown">
        <h4 style="color:#374151; margin-bottom: 12px;">What Your Guests Will Create:</h4>
        <div class="project-item"><span class="project-icon">🖊️</span> <strong>${guestCount} Beadable Pens</strong> — Refillable ballpoints with custom silicone focal beads.</div>
        <div class="project-item"><span class="project-icon">🎒</span> <strong>${guestCount} Backpack Charm Keychains</strong> — Swivel lobster clasps for backpacks or keys.</div>
        <div class="project-item"><span class="project-icon">💫</span> <strong>${guestCount} Keepsake Stretch Bracelets</strong> — Durable 0.8mm elastic with name letters.</div>
      </div>

      <p>Every kit includes 2 craft scissors, 2 anti-roll bead sorting trays, 15 individual sheer organza gift bags, 15 step-by-step guest cards, and our signature <strong>Host Spare Supply Envelope</strong>!</p>

      <div class="button-wrap">
        <a href="${hostGuideUrl}" class="cta-button">Download Host Planning Guide &amp; Timeline</a>
      </div>

      <p style="font-size:14px; color:#6b7280;">Estimated Delivery Window: <strong>${estimatedDeliveryRange}</strong>. We will send carrier tracking the moment your kit leaves our studio.</p>
    </div>
    <div class="footer">
      <p>Questions about your upcoming party? Reach our customer care team anytime at <a href="mailto:help@beadsily.com" style="color:#9333ea;">help@beadsily.com</a>.</p>
      <p>&copy; 2026 BeadsILY. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `==================================================
BEADSILY CRAFT STUDIO — ORDER CONFIRMATION
==================================================

Woohoo, ${customerFirstName}! Your craft celebration is official.

Thank you for choosing BeadsILY. We are hand-packing your order and preparing your premium supplies for an unforgettable gathering.

ORDER DETAILS:
- Order Number: #${orderNumber}
- Party Package: ${productTitle} (${guestCount} Guests)
- Guaranteed Finished Projects: ${totalProjectCount} Projects (3 per guest)
- Theme: ${themeName}
- Total Paid: $${totalAmountDollars}
- Shipping Address:
  ${shippingName}
  ${shippingStreet}
  ${shippingCity}, ${shippingState} ${shippingZip}

WHAT YOUR GUESTS WILL CREATE:
- ${guestCount} Custom Beadable Pens (Refillable black ballpoints)
- ${guestCount} Backpack Charm Keychains (Swivel lobster clasps)
- ${guestCount} Keepsake Stretch Bracelets (Durable 0.8mm elastic with name letters)

EVERY KIT INCLUDES:
- 2 Child-Safe Craft Scissors
- 2 Anti-Roll Bead Sorting Trays
- 15 Individual Sheer Organza Favor Gift Bags
- 15 Guest Step-by-Step Cards
- The BeadsILY Host Spare Supply Envelope

DOWNLOAD YOUR HOST PLANNING GUIDE:
${hostGuideUrl}

Estimated Delivery Window: ${estimatedDeliveryRange}
Carrier tracking will follow as soon as your box dispatches.

Questions? Email us at help@beadsily.com.
Happy Crafting!
`;

  return {
    subject,
    preheader,
    html,
    text
  };
}
