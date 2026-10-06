# BeadsILY Customer Support Knowledge Base, FAQs & Operational Triage Matrix

**Version:** 1.0.0 (Launch Operations Master)  
**Author:** Marisol (`marisol-muwiha89`), Customer Experience & Host Journey Lead  
**Operational Review:** Pam (`pam-muwic8fg`), Product Operations  
**Compliance & QA Review:** Toby (`toby-muwie8nd`), Independent QA Certifier  
**Relevant Acceptance Requirements:** `MYS-06`, `INV-08`, `SUB-04`, `KIT-01`, `EMAIL-04`

---

## 1. Public Customer Support FAQs (Storefront & Help Center)

### Section A: Party Kits & Customization
**Q1: What exactly comes inside a BeadsILY 15-Guest Party Kit?**  
*A:* Every 15-Guest Party Kit delivers **45 complete, keepsake-quality craft projects**—exactly **three projects for each of your 15 guests**:
1. 15 Custom Beadable Pens (with refillable black ink)
2. 15 Backpack Charm Keychains (with heavy-duty swivel lobster clasps)
3. 15 Stretch Keepsake Bracelets (with 0.8mm high-durability elastic cord)
In addition, the kit includes our shared Host Tool Kit (2 craft scissors, 2 anti-roll velvet bead trays), 45 theme silicone focal beads, 270 accent/spacer beads, 60 alphabet letter beads, 15 individual sheer organza favor gift bags, 15 guest step-by-step assembly cards, and our signature **Host Spare Supply Envelope**.

**Q2: Can I host more than 15 guests?**  
*A:* Yes! You can expand your party in 5-guest increments during checkout. Each 5-guest add-on includes 15 additional projects (5 pens, 5 keychains, 5 bracelets), plus 5 more gift bags and guest cards, perfectly matched to your selected theme.

**Q3: What age group are BeadsILY party kits designed for?**  
*A:* Our kits are designed for crafters aged **6 and up** with active adult supervision, and are equally adored by tweens, teens, and adults! Because kits contain small beads and metal parts, they present a potential choking hazard and are **not suitable for children under 3 years of age**.

**Q4: Can guests spell their full names on their projects?**  
*A:* Each kit includes a pooled assortment of 60 high-demand alphabet beads. This provides plenty of letters for every guest to feature their first and last initials or short nicknames (3–4 letters). For longer names, hosts often suggest using initials paired with our colorful theme focal beads!

**Q5: How far in advance should I order my party kit?**  
*A:* We recommend placing your order at least **10 to 14 business days before your scheduled party date**. Standard nationwide shipping takes 3 to 5 business days following our 2-business-day hand-packout preparation.

---

### Section B: Curated Mystery Boxes
**Q6: What is a BeadsILY Curated Mystery Box?**  
*A:* A BeadsILY Mystery Box is a curated, physical craft assortment where the project count and supply quality are 100% guaranteed, but the theme styling, colorway, and focal charms are a delightful surprise!
- **Mystery Maker (Solo):** Guaranteed 3 projects (1 pen, 1 keychain, 1 bracelet).
- **Bestie Mystery Duo (2 People):** Guaranteed 6 projects (2 pens, 2 keychains, 2 bracelets).
- **Mystery Party (15 Guests):** Guaranteed 45 projects in a coordinated surprise group palette.

**Q7: Is the mystery box a lottery or subscription?**  
*A:* **Never!** We do **not** engage in online lotteries, prize wheels, ticket games, or gambling mechanics. You are purchasing a premium physical craft kit. Purchasing a one-time mystery box **never** enrolls you in recurring subscription billing.

**Q8: Can I return a mystery box if I don't like the surprise theme?**  
*A:* Because mystery boxes are sealed prepacked units assembled in limited drops, we cannot accept returns based on subjective color or theme preferences once opened. However, if any piece arrives damaged or defective, we will happily replace it immediately!

---

### Section C: Monthly Craft Box Subscriptions
**Q9: How does the BeadsILY Monthly Subscription work?**  
*A:* Each month, our creative team curates an exclusive, seasonal physical craft box delivered right to your doorstep. You will be billed on the 1st of each month, and your kit dispatches by the 10th of that month.

**Q10: What is your cutoff date for skipping or canceling my subscription?**  
*A:* You have complete self-service control via your account dashboard. To skip an upcoming month or cancel your subscription, updates must be submitted prior to **11:59:59 PM America/Phoenix time on the final calendar day of the month**. Requests received after the cutoff will apply to the subsequent billing cycle, as your monthly box has already entered fulfillment packing.

---

## 2. Operational Support Triage Matrix

When a customer contacts `help@beadsily.com`, support representatives must resolve inquiries using the following authorized protocol:

```
[Inbound Inquiry]
       |
       +---> Category A: Missing/Damaged Party Kit Supply (KIT-ERR-01)
       |        --> Check Host Spare Supply Envelope
       |        --> If unresolved, dispatch USPS First Class Replacement Packet
       |
       +---> Category B: Damaged Mystery Box / Defective Focal (MYS-ERR-01)
       |        --> Lookup D1 Lot Snapshot
       |        --> Dispatch exact matching replacement focal
       |
       +---> Category C: Carrier Delay / Missed Party Date (SHIP-ERR-01)
       |        --> Verify Carrier Tracking
       |        --> Return-to-sender full refund OR courtesy store credit
       |
       +---> Category D: Subscription Cutoff Inquiries (SUB-ERR-01)
                --> Verify America/Phoenix timestamp
                --> Pre-cutoff: Immediate cancel/skip
                --> Post-cutoff: Apply to following cycle
```

---

### Triage Matrix & Resolution Standards

| Triage Code | Customer Situation | Required Investigation | Authorized Resolution Policy | Forbidden Actions (Guardrails) |
| :--- | :--- | :--- | :--- | :--- |
| **`KIT-ERR-01`** | Customer reports a damaged pen mandrel or missing focal bead before their party. | 1. Ask customer for Order ID.<br/>2. Inquire if Host Spare Supply Envelope has been checked.<br/>3. Request clear photo of damaged item. | **Immediate Replacement Packet:** Dispatch replacement part via USPS Priority/First Class within 24 hours at zero cost to customer. Update D1 inventory movement ledger with `movement_type: 'correction'`. | **DO NOT** demand full kit return.<br/>**DO NOT** issue cash refund without escalating to Michael/god.<br/>**DO NOT** leave customer empty-handed before their party. |
| **`MYS-ERR-01`** | Customer reports broken charm or missing part in a sealed Mystery Box (`MYS-06`). | 1. Check order number in D1 database.<br/>2. Retrieve specific prepacked sealed unit lot ID.<br/>3. Verify photo of defective part against lot snapshot. | **Lot-Matched Replacement:** Dispatch replacement focal/bead matching the registered lot theme within 24h. If lot is depleted, offer approved alternate focal from the same theme category. | **DO NOT** disclose confidential future mystery themes.<br/>**DO NOT** restock returned opened mystery boxes without QA physical inspection (`INV-08`). |
| **`SHIP-ERR-01`** | Carrier delay resulted in kit arriving after customer's party date. | 1. Audit delivery date vs promised transit window.<br/>2. Check if customer gave required 10-day lead time. | **Option 1 (Return & Full Refund):** Customer marks package "Return to Sender" unopened; 100% refund issued upon carrier scan.<br/>**Option 2 (Keep & Play):** Customer keeps kit for future play; offer **20% courtesy store credit** (requires supervisor note). | **DO NOT** issue discretionary cash compensation over $25 without supervisor sign-off.<br/>**DO NOT** blame customer for carrier transit anomalies. |
| **`SUB-ERR-01`** | Customer asks to skip or cancel after billing cycle cutoff. | 1. Check transaction timestamp in America/Phoenix time.<br/>2. Verify whether fulfillment order is in `allocated`, `packing`, or `shipped` state. | **If post-cutoff and box packed:** Politely explain cutoff policy; confirm current box is in transit; cancel all future renewals immediately.<br/>**If pre-cutoff:** Immediate cancellation and refund if accidental charge occurred within grace window. | **DO NOT** promise manual warehouse package intercept once box has shipped.<br/>**DO NOT** alter billing dates in Stripe manually. |

---

## 3. Representative Support Scripts

### Script A: Damaged Component Replacement (`KIT-ERR-01`)
> *"Dear [Customer Name],*  
> *Thank you for reaching out, and we are so sorry to hear about the damaged [Component Name]! Every BeadsILY party should be pure fun, and we are here to make this right immediately.*  
> *First, please check your kit box for our gold-embossed **Host Spare Supply Envelope**—we include extra components and beads in every box just in case! If you need an additional piece, we have dispatched a complimentary replacement packet directly to your address via USPS Priority Mail (Tracking: [Tracking#]). It will arrive by [Date].*  
> *Wishing you and your guests an extraordinary craft party!*  
> *Warmly,*  
> *The BeadsILY Customer Care Team"*

### Script B: Mystery Box Damaged Piece Resolution (`MYS-ERR-01`)
> *"Dear [Customer Name],*  
> *Thank you for contacting us! We take tremendous pride in the curation and packout of our Curated Mystery Boxes. We are so sorry that your [Focal/Pen/Hardware] arrived defective.*  
> *We have referenced your box's specific assembly lot ([Lot ID]) and are rushing an exact replacement focal directly to you today at no charge. You do not need to send the broken piece back to us.*  
> *Please let us know if we can assist with anything else as you enjoy your craft creations!*  
> *Warmly,*  
> *The BeadsILY Customer Care Team"*

---

## 4. Policy Guardrails & Floor Governance

1. **No Unauthorized Financial Commitments:** Customer support specialists may **never** promise discretionary cash settlements, off-platform refunds, or gift cards exceeding standard policy thresholds ($25 maximum courtesy credit) without Michael's (`god`) explicit written authorization.
2. **Physical Restock Segregation (`INV-08`):** Restocking a returned physical product is strictly decoupled from issuing a monetary refund. Returned boxes must be routed to the quarantine bin for physical inspection by Pam (`pam-muwic8fg`) before any balance is added back to D1 saleable inventory.
3. **Inbound Attachment Sanitization (`EMAIL-04`):** Support specialists must never open `.exe`, `.scr`, `.bat`, or macro-enabled attachments submitted to `help@beadsily.com`. Attachments are restricted to `.png`, `.jpg`, `.jpeg`, `.pdf` and scanned via Cloudflare edge filters.
