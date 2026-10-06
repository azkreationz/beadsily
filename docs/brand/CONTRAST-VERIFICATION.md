# BeadsILY Storefront: WCAG 2.2 AA Contrast Verification & Accessibility Matrix

**Author:** Karen (`karen-muwifd9v`), Brand & Creative Direction Lead  
**Independent Reviewers:** Erin (`erin-muwidjtc`, Storefront UX), Toby (`toby-muwie8nd`, Independent QA)  
**Executive Approval:** Korry Nelson (Owner), Michael (`god`, Floor Manager)  
**Standard Target:** WCAG 2.2 Level AA (with Level AAA compliance on primary text)  
**Date:** October 6, 2026  
**Reference Source:** Physical 8x2ft Canopy Banner (`beadsily-canopy-banner-8x2ft.pdf`) & Legacy Vector Master (`logo-1.svg`)

---

## 1. Executive Summary & Core Rules

The BeadsILY visual identity balances playful, festive energy (for children's parties, school festivals, and craft celebrations) with sophisticated, trustworthy clarity (for adult purchasers, host parents, and corporate buyers).

To guarantee accessibility without diluting brand personality, this specification establishes **strict token pairing rules**:

1. **Body & Paragraph Text:** MUST use `charcoal-950` (`#171416`) or `charcoal-700` (`#373035`) on light surfaces. Contrast ratio exceeds **17.3:1** (far exceeding the 7.0:1 WCAG AAA requirement).
2. **Text Links & Action Labels on Light Backgrounds:** MUST use `raspberry.text` (`#C72B63`), achieving **5.04:1** on Pearl Cream (`#FFF8EF`) and **5.30:1** on White (`#FFFFFF`). Never use `#FF689D` for text on light backgrounds.
3. **Primary Action Buttons ("Add to Bag", "Customize 15-Guest Kit"):**
   - **Recommended Style (Bubblegum Pill):** Background `pink-500` (`#FF689D`) with Text `charcoal-950` (`#171416`). Contrast ratio is **6.72:1** (Passes WCAG 2.2 AA for normal text and AAA for large text/buttons).
   - **High-Contrast Alternative (Noir Pill):** Background `charcoal-950` (`#171416`) with Text `cream-50` (`#FFFFFF`). Contrast ratio is **18.29:1** (Passes WCAG AAA).
4. **Interactive Component Boundaries & Focus Rings:**
   - Active focus ring uses `raspberry-500` (`#D93D75`) with a 2px offset on light backgrounds (3.0:1 non-text contrast requirement satisfied).
   - Form inputs use `cream-300` (`#E7DECB`) borders default, shifting to `charcoal-950` on hover and `raspberry-500` (with 3px focus glow) on focus.

---

## 2. Mathematical Luminance & Contrast Formulations

Relative luminance $L$ is calculated per W3C WCAG 2.2 specifications:

$$L = 0.2126 \times R + 0.7152 \times G + 0.0722 \times B$$

Where $sRGB$ color channels $C \in \{R, G, B\} \in [0, 1]$ are linearized:

$$C = \begin{cases} \frac{C_{sRGB}}{12.92} & \text{if } C_{sRGB} \le 0.04045 \\ \left(\frac{C_{sRGB} + 0.055}{1.055}\right)^{2.4} & \text{if } C_{sRGB} > 0.04045 \end{cases}$$

The contrast ratio $CR$ between lighter luminance $L_1$ and darker luminance $L_2$ is:

$$CR = \frac{L_1 + 0.05}{L_2 + 0.05}$$

### Linearized Relative Luminance Benchmarks

| Color Token | Hex Code | Relative Luminance ($L$) | Role |
| :--- | :---: | :---: | :--- |
| **White** | `#FFFFFF` | **1.0000** | Card highlights & light mode modal surface |
| **Pearl Cream (`cream-100`)** | `#FFF8EF` | **0.9416** | Core storefront canvas & canopy background |
| **Sand Neutral (`cream-300`)** | `#E7DECB` | **0.7225** | Secondary containers, dividers, table borders |
| **Amber Gold (`amber-500`)** | `#FFC107` | **0.5732** | Ratings stars, craft badges, holiday accents |
| **Bubblegum Pink (`pink-500`)** | `#FF689D` | **0.2982** | Hero wordmark accent, primary button fill, decorative pills |
| **Brand Raspberry (`raspberry-500`)** | `#D93D75` | **0.1477** | Canopy vector stroke, icons, headings >= 24px |
| **Accessible Raspberry (`raspberry.text`)** | `#C72B63` | **0.1171** | Text links, interactive body labels, category chips |
| **Slate Charcoal (`charcoal-700`)** | `#373035` | **0.0336** | Secondary metadata, captions, order item counts |
| **Charcoal Noir (`charcoal-950`)** | `#171416` | **0.0071** | Master brand typography, body copy, primary headings |

---

## 3. Comprehensive Pairing Verification Matrix

### Canvas A: Pearl Cream (`#FFF8EF`, $L = 0.9416$) — Main Storefront Background

| Foreground Token | Hex Code | Contrast Ratio | WCAG 2.2 AA Normal ($\ge 4.5:1$) | WCAG 2.2 AA Large ($\ge 3.0:1$) | WCAG 2.2 AAA Normal ($\ge 7.0:1$) | Permitted Usages |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Charcoal Noir (`charcoal-950`)** | `#171416` | **17.36:1** | **PASS** | **PASS** | **PASS** | **Primary body text, headings, price tags, table cells** |
| **Slate Charcoal (`charcoal-700`)** | `#373035` | **12.17:1** | **PASS** | **PASS** | **PASS** | **Secondary descriptions, SKU numbers, breadcrumbs** |
| **Accessible Raspberry (`raspberry.text`)** | `#C72B63` | **5.04:1** | **PASS** | **PASS** | Fail | **Interactive inline text links, active tabs, filter tags** |
| **Brand Raspberry (`raspberry-500`)** | `#D93D75` | **4.09:1** | Fail | **PASS** | Fail | **Headings $\ge 24\text{px}$ bold, UI icons $\ge 24\text{px}$, borders** |
| **Bubblegum Pink (`pink-500`)** | `#FF689D` | **2.58:1** | Fail | Fail | Fail | **Button background ONLY, pill badge background, graphics** |
| **Amber Gold (`amber-500`)** | `#FFC107` | **1.55:1** | Fail | Fail | Fail | **Star rating fill with Charcoal outline; never bare text** |
| **Sand Neutral (`cream-300`)** | `#E7DECB` | **1.27:1** | Fail | Fail | Fail | **Container card fills, subtle dividing rules** |

---

### Canvas B: Pure White (`#FFFFFF`, $L = 1.0000$) — Product Cards & Modal Surfaces

| Foreground Token | Hex Code | Contrast Ratio | WCAG 2.2 AA Normal | WCAG 2.2 AA Large | Permitted Usages |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Charcoal Noir (`charcoal-950`)** | `#171416` | **18.29:1** | **PASS** | **PASS** | **All text, headings, prices, form labels** |
| **Slate Charcoal (`charcoal-700`)** | `#373035` | **12.83:1** | **PASS** | **PASS** | **Secondary descriptions, captions, placeholders** |
| **Accessible Raspberry (`raspberry.text`)** | `#C72B63` | **5.30:1** | **PASS** | **PASS** | **Text links, clickable options, active pill text** |
| **Brand Raspberry (`raspberry-500`)** | `#D93D75` | **4.31:1** | Fail | **PASS** | **Large titles ($\ge 24\text{px}$), heart icon badges, borders** |
| **Bubblegum Pink (`pink-500`)** | `#FF689D` | **2.72:1** | Fail | Fail | **Button background, badge background** |

---

### Canvas C: Charcoal Noir (`#171416`, $L = 0.0071$) — Footer, Hero Banners & Dark Cards

| Foreground Token | Hex Code | Contrast Ratio | WCAG 2.2 AA Normal | WCAG 2.2 AA Large | Permitted Usages |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Pure White (`cream-50`)** | `#FFFFFF` | **18.29:1** | **PASS** | **PASS** | **Footer headings, primary text on dark cards** |
| **Pearl Cream (`cream-100`)** | `#FFF8EF` | **17.36:1** | **PASS** | **PASS** | **Body copy on dark hero banners, modal subtitles** |
| **Sand Neutral (`cream-300`)** | `#E7DECB` | **13.68:1** | **PASS** | **PASS** | **Muted footer links, copyright notice, dividers** |
| **Amber Gold (`amber-500`)** | `#FFC107` | **11.22:1** | **PASS** | **PASS** | **Highlighted promotional banners, badge tags** |
| **Bubblegum Pink (`pink-500`)** | `#FF689D` | **6.72:1** | **PASS** | **PASS** | **Hero accent text, "ILY" wordmark element, active icons** |
| **Brand Raspberry (`raspberry-500`)** | `#D93D75` | **4.25:1** | Fail | **PASS** | **Large display headers, graphic borders** |

---

### Canvas D: Bubblegum Pink (`#FF689D`, $L = 0.2982$) — Primary Button Fill

| Foreground Token | Hex Code | Contrast Ratio | Status | Recommendation |
| :--- | :---: | :---: | :---: | :--- |
| **Charcoal Noir (`charcoal-950`)** | `#171416` | **6.72:1** | **PASS (AA Normal & AAA Large)** | **STANDARD BUTTON TEXT SPECIFICATION** |
| **Pure White (`cream-50`)** | `#FFFFFF` | **2.72:1** | **FAIL** | **STRICTLY PROHIBITED:** White text on Bubblegum pink fails WCAG AA |

> [!CAUTION]
> **CRITICAL BUTTON IMPLEMENTATION RULE FOR ERIN:**  
> When creating primary CTA buttons with `bg-pink-500` (`#FF689D`), the button text MUST be `text-charcoal-950 font-bold` (`#171416`), NEVER `text-white`. White text on pink has an unacceptable 2.72:1 contrast ratio that violates WCAG AA and will fail Toby's automated Playwright axe-core audit.

---

## 4. UI Component Accessibility Specifications

### 4.1. Buttons & Call-to-Actions

```tsx
// Primary CTA (e.g. "Reserve 15-Guest Kit")
<button className="bg-pink-500 text-charcoal-950 hover:bg-pink-400 active:bg-raspberry-600 active:text-white px-6 py-3 rounded-full font-bold text-body-md shadow-md focus:outline-none focus:ring-4 focus:ring-raspberry-500/40 transition-all">
  Reserve 15-Guest Kit — $189
</button>

// Secondary CTA (e.g. "View Assembly Guide")
<button className="bg-cream-100 text-charcoal-950 border-2 border-charcoal-950 hover:bg-cream-200 px-6 py-3 rounded-full font-semibold text-body-md focus:outline-none focus:ring-4 focus:ring-charcoal-950/20 transition-all">
  View Assembly Guide
</button>

// Text Link
<a href="/party-kits" className="text-raspberry-600 hover:text-raspberry-700 underline font-semibold focus:outline-none focus:ring-2 focus:ring-raspberry-500 rounded-sm">
  Explore All 7 Party Kits &rarr;
</a>
```

### 4.2. Form Inputs & Selectors

- **Default Border:** 1.5px solid `cream-300` (`#E7DECB`) with `bg-white`
- **Hover State:** 1.5px solid `charcoal-700` (`#373035`)
- **Focus State:** 2px solid `raspberry-600` (`#C72B63`) with `ring-4 ring-raspberry-500/20`
- **Error State:** 2px solid `status-danger` (`#EF4444`) with error text in `#B91C1C` (5.2:1 contrast)
- **Label Text:** `text-charcoal-950 font-semibold text-body-sm` (18.29:1 contrast)

### 4.3. Non-Text Contrast (WCAG 2.2 SC 1.4.11)

- All UI boundaries (inputs, radio buttons, quantity steppers, checkbox borders) have at least **3.0:1 contrast** against their adjacent backgrounds.
- Active segmented tabs use `charcoal-950` fill with `white` text (18.29:1) for unambiguous selected state.

---

## 5. Independent QA Certification Checklist (Toby)

Before any release slice is certified under `ACCEPTANCE-MATRIX.md`, Toby must verify:

- [ ] Automated axe-core scan on `/`, `/party-kits`, `/kits/[slug]`, and `/checkout` reports 0 contrast violations.
- [ ] No button renders white text on `#FF689D`.
- [ ] All interactive text links achieve $\ge 4.5:1$ against their immediate container fill.
- [ ] Focus indicators are visibly distinct with $\ge 3:1$ contrast against adjacent background.
- [ ] Text can be scaled to 200% zoom without clipping or horizontal scrollbar emergence.
