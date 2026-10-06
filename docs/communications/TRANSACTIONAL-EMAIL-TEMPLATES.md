# BeadsILY Transactional Email Communication Templates

**Version:** 1.0.0 (Production Templates)  
**Author:** Marisol (`marisol-muwiha89`), Customer Experience & Host Journey Lead  
**Technical Implementation Lead:** Oscar (`oscar-muwid2fm`), Backend & Email Engineer  
**Storefront Review:** Erin (`erin-muwidjtc`), Storefront UX Engineer  
**Brand Review:** Karen (`karen-muwifd9v`), Brand & Creative Direction Lead  
**Relevant Acceptance Requirements:** `EMAIL-01..04`, `CAT-01`, `MYS-01`, `SUB-04`

---

## 1. Template Overview & Design Standards

BeadsILY transactional emails communicate warmth, precision, and complete clarity. Every email adheres to these mandatory design principles:
1. **Truthful Project Accounting (`CAT-01`):** A 15-guest party kit is explicitly described as **45 finished craft projects** (15 pens, 15 keychains, 15 bracelets), with transparent guest counts and included supplies.
2. **Accessible Dual-MIME:** Every template is authored in semantic responsive HTML accompanied by a clean plain-text fallback (`multipart/alternative`).
3. **Actionable Pre-Party Enablement:** Order and shipping confirmations provide immediate digital access to the Host Master Guide so hosts can prepare seating and timeline ahead of delivery.
4. **Timezone Clarity (`SUB-04`):** Subscription billing and cutoff notices explicitly specify **America/Phoenix** time.

---

## 2. Template 1: Order Confirmation (`order_confirmation.html`)

**Subject:** *Your BeadsILY Craft Party is on its way! Order #{{order_number}}*  
**Preheader:** *Get ready to craft 45 keepsakes! View your order details and host guide inside.*

### HTML Version
```html
<!DOCTYPE html>
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
      <div class="greeting">Woohoo, {{customer_first_name}}! Your craft celebration is official.</div>
      <p>Thank you for choosing BeadsILY. We are hand-packing your order and preparing your premium supplies for an unforgettable gathering.</p>
      
      <div class="summary-card">
        <h3 style="margin-top:0; color:#7e22ce;">Order Summary #{{order_number}}</h3>
        <p><strong>Party Package:</strong> {{product_title}} ({{guest_count}} Guests)</p>
        <p><strong>Guaranteed Output:</strong> {{total_project_count}} Finished Keepsake Projects</p>
        <p><strong>Theme Selected:</strong> {{theme_name}}</p>
        <p><strong>Total Paid:</strong> ${{total_amount_dollars}} via Stripe</p>
        <p><strong>Shipping Address:</strong><br/>{{shipping_name}}<br/>{{shipping_street}}<br/>{{shipping_city}}, {{shipping_state}} {{shipping_zip}}</p>
      </div>

      <div class="project-breakdown">
        <h4 style="color:#374151; margin-bottom: 12px;">What Your Guests Will Create:</h4>
        <div class="project-item"><span class="project-icon">🖊️</span> <strong>{{guest_count}} Beadable Pens</strong> — Refillable ballpoints with custom silicone focal beads.</div>
        <div class="project-item"><span class="project-icon">🎒</span> <strong>{{guest_count}} Backpack Charm Keychains</strong> — Swivel lobster clasps for backpacks or keys.</div>
        <div class="project-item"><span class="project-icon">💫</span> <strong>{{guest_count}} Keepsake Stretch Bracelets</strong> — Durable 0.8mm elastic with name letters.</div>
      </div>

      <p>Every kit includes 2 craft scissors, 2 anti-roll bead sorting trays, 15 individual sheer organza gift bags, 15 step-by-step guest cards, and our signature <strong>Host Spare Supply Envelope</strong>!</p>

      <div class="button-wrap">
        <a href="{{host_guide_url}}" class="cta-button">Download Host Planning Guide & Timeline</a>
      </div>

      <p style="font-size:14px; color:#6b7280;">Estimated Delivery Window: <strong>{{estimated_delivery_range}}</strong>. We will send carrier tracking the moment your kit leaves our studio.</p>
    </div>
    <div class="footer">
      <p>Questions about your upcoming party? Reach our customer care team anytime at <a href="mailto:help@beadsily.com" style="color:#9333ea;">help@beadsily.com</a>.</p>
      <p>&copy; 2026 BeadsILY. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

### Plain-Text Version
```
==================================================
BEADSILY CRAFT STUDIO — ORDER CONFIRMATION
==================================================

Woohoo, {{customer_first_name}}! Your craft celebration is official.

Thank you for choosing BeadsILY. We are hand-packing your order and preparing your premium supplies for an unforgettable gathering.

ORDER DETAILS:
- Order Number: #{{order_number}}
- Party Package: {{product_title}} ({{guest_count}} Guests)
- Guaranteed Finished Projects: {{total_project_count}} Projects (3 per guest)
- Theme: {{theme_name}}
- Total Paid: ${{total_amount_dollars}}
- Shipping Address:
  {{shipping_name}}
  {{shipping_street}}
  {{shipping_city}}, {{shipping_state}} {{shipping_zip}}

WHAT YOUR GUESTS WILL CREATE:
- {{guest_count}} Custom Beadable Pens (Refillable black ballpoints)
- {{guest_count}} Backpack Charm Keychains (Swivel lobster clasps)
- {{guest_count}} Keepsake Stretch Bracelets (Durable 0.8mm elastic with name letters)

EVERY KIT INCLUDES:
- 2 Child-Safe Craft Scissors
- 2 Anti-Roll Bead Sorting Trays
- 15 Individual Sheer Organza Favor Gift Bags
- 15 Guest Step-by-Step Cards
- The BeadsILY Host Spare Supply Envelope

DOWNLOAD YOUR HOST PLANNING GUIDE:
{{host_guide_url}}

Estimated Delivery Window: {{estimated_delivery_range}}
Carrier tracking will follow as soon as your box dispatches.

Questions? Email us at help@beadsily.com.
Happy Crafting!
```

---

## 3. Template 2: Shipping & Tracking Notification (`order_shipped.html`)

**Subject:** *Your BeadsILY Kit has shipped! Track Order #{{order_number}}*  
**Preheader:** *Your party supplies are on the way via {{carrier_name}}. Tracking: {{tracking_number}}*

### Key Content Elements:
- Carrier Name (e.g. USPS Priority Mail, UPS Ground)
- Active Tracking Number and direct click-through URL
- Estimated Delivery Date
- **Host Pre-Party 3-Minute Checklist:**
  1. *Clear your table space* — Ensure seating for 15 crafters.
  2. *Designate your bead trays* — Place 1 sorting tray between every 7–8 seats.
  3. *Review the 75-minute timeline* — Familiarize yourself with the 3 projects in the Host Master Guide.

---

## 4. Template 3: Monthly Craft Box Drop Announcement (`monthly_drop.html`)

**Subject:** *Sneak Peek: Reveal of the {{month_name}} BeadsILY Craft Box!*  
**Preheader:** *This month's theme: {{theme_title}}! Confirm or skip by {{cutoff_date_phoenix}}.*

### Key Content Elements:
- Highlighting the new monthly theme and exclusive silicone focals.
- Reminder of guaranteed 3 projects included in the monthly box.
- Clear, prominent cutoff notice:  
  > *"Need to skip or update your address this month? Self-service controls are active in your dashboard until **{{cutoff_date_phoenix}} at 11:59:59 PM America/Phoenix time**."*
- Direct button to Account Management Portal.

---

## 5. Template 4: Replacement Dispatch Notification (`replacement_dispatched.html`)

**Subject:** *Your BeadsILY Replacement Packet is on its way! (Ref: #{{ticket_id}})*  
**Preheader:** *We've rushed your replacement supplies via {{carrier_name}}. Tracking inside.*

### Key Content Elements:
- Sincere customer-first confirmation that replacement parts were packed and dispatched at zero cost.
- Itemized list of replacement components sent (e.g., *1x Theme Silicone Focal Bead, 1x Metal Pen Mandrel*).
- Tracking number with expedited transit expectation.
- Friendly reminder that the Host Spare Supply Envelope in their party box contains additional backup beads.
