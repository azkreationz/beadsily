/**
 * BeadsILY Transactional Email Template: Customer Support Acknowledgment
 * Requirement: EMAIL-02, EMAIL-04
 * Auto-reply with ticket ID and SLA commitment
 */

export function renderSupportAcknowledgment(data = {}) {
  const customerName = data.customerName || 'BeadsILY Crafter';
  const ticketId = data.ticketId || 'TKT-' + Math.floor(100000 + Math.random() * 900000);
  const userSubject = data.userSubject || 'Party Kit Inquiry';
  const slaHours = data.slaHours || '24 business hours';
  const faqUrl = data.faqUrl || 'https://beadsily.com/faq';

  const subject = `We've received your request! BeadsILY Support Ref: #${ticketId}`;
  const preheader = `Thank you for contacting BeadsILY. We've logged your message under #${ticketId}.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>BeadsILY Support Inquiry Received</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf5ff; color: #2d3748; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #f3e8ff; overflow: hidden; }
    .header { background: #9333ea; color: #ffffff; padding: 20px; text-align: center; }
    .header h2 { margin: 0; }
    .content { padding: 24px; }
    .ticket-badge { background: #f3e8ff; color: #7e22ce; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 16px; }
    .footer { background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>BeadsILY Customer Care</h2>
    </div>
    <div class="content">
      <div class="ticket-badge">Ticket Ref: #${ticketId}</div>
      <p>Hello ${customerName},</p>
      <p>Thank you for reaching out to us! We have received your message regarding: <em>"${userSubject}"</em>.</p>
      <p>Our customer care team reviews all inquiries during regular studio hours and will get back to you within <strong>${slaHours}</strong>.</p>
      <p>In the meantime, you might find an instant answer to common party planning or kit assembly questions in our <a href="${faqUrl}" style="color:#9333ea;">Frequently Asked Questions</a>.</p>
      <p>Warmly,<br/>The BeadsILY Customer Care Team</p>
    </div>
    <div class="footer">
      Please reply directly to this email to add more details to your ticket. &bull; BeadsILY Studio
    </div>
  </div>
</body>
</html>`;

  const text = `==================================================
BEADSILY CUSTOMER CARE — INQUIRY RECEIVED
==================================================

Ticket Reference: #${ticketId}

Hello ${customerName},

Thank you for reaching out to BeadsILY! We have received your message regarding: "${userSubject}".

Our customer care team reviews all inquiries and will respond within ${slaHours}.

Need an immediate answer? Check our FAQ: ${faqUrl}

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
