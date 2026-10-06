/**
 * BeadsILY Transactional Email Template: Monthly Craft Box Drop Announcement
 * Requirement: SUB-04 (Explicit America/Phoenix cutoff notice), EMAIL-02
 * Copy & Design: Marisol (marisol-muwiha89)
 */

export function renderMonthlyDrop(data = {}) {
  const customerFirstName = data.customerFirstName || 'Crafter';
  const monthName = data.monthName || 'November 2026';
  const themeTitle = data.themeTitle || 'Desert Twilight Sparkle';
  const cutoffDatePhoenix = data.cutoffDatePhoenix || 'October 31, 2026 at 11:59:59 PM America/Phoenix';
  const portalUrl = data.portalUrl || 'https://beadsily.com/account/subscription';

  const subject = `Sneak Peek: Reveal of the ${monthName} BeadsILY Craft Box!`;
  const preheader = `This month's theme: ${themeTitle}! Confirm or skip by ${cutoffDatePhoenix}.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>BeadsILY Monthly Craft Box Reveal</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf5ff; color: #2d3748; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #f3e8ff; overflow: hidden; }
    .header { background: linear-gradient(135deg, #a855f7, #ec4899); color: #ffffff; padding: 28px; text-align: center; }
    .content { padding: 28px; }
    .theme-box { background: #fdf4ff; border: 1px solid #f5d0fe; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .cutoff-alert { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; color: #92400e; }
    .cta-button { background-color: #9333ea; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; }
    .footer { background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size:24px;">Monthly Craft Box Reveal</h1>
    </div>
    <div class="content">
      <p>Hello ${customerFirstName},</p>
      <p>Get ready for next month's creative journey! Here is your exclusive reveal for <strong>${monthName}</strong>:</p>

      <div class="theme-box">
        <h2 style="margin:0 0 8px 0; color:#7e22ce;">Theme: ${themeTitle}</h2>
        <p style="margin:0; color:#4b5563;">Includes supplies for 3 complete keepsake projects: 1 custom pen, 1 charm keychain, and 1 designer bracelet.</p>
      </div>

      <div class="cutoff-alert">
        <strong>Cutoff &amp; Skip Notice:</strong><br/>
        Need to skip this month or update your shipping address? Self-service adjustments are available in your account portal until <strong>${cutoffDatePhoenix}</strong>.
      </div>

      <div style="text-align:center; margin: 24px 0;">
        <a href="${portalUrl}" class="cta-button">Manage Monthly Subscription</a>
      </div>
    </div>
    <div class="footer">
      BeadsILY Monthly Craft Club &bull; Santa Fe Elementary Fall Festival Edition
    </div>
  </div>
</body>
</html>`;

  const text = `==================================================
BEADSILY MONTHLY CRAFT BOX REVEAL — ${monthName}
==================================================

Hello ${customerFirstName},

Theme of the Month: ${themeTitle}
Includes 3 complete craft keepsakes (pen, keychain, bracelet).

CUTOFF & SKIP NOTICE:
Need to skip this month or update your address?
Self-service controls are open in your portal until ${cutoffDatePhoenix}.

MANAGE YOUR SUBSCRIPTION:
${portalUrl}

Happy Crafting!
The BeadsILY Team
`;

  return {
    subject,
    preheader,
    html,
    text
  };
}
