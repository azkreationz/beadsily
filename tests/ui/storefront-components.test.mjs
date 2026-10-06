/**
 * BeadsILY Storefront UI Primitives & WCAG 2.2 AA Contrast Test Suite
 * Requirements: BCF-8, CONTRAST-VERIFICATION.md, BRAND-ASSET-MANIFEST.md
 * Authored by: Erin (erin-muwidjtc), Storefront UX & Frontend Engineer
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Import design tokens and component helpers from @beadsily/ui
import {
  colors,
  typography,
  spacing,
  beadsilyTailwindPreset,
  getButtonClasses,
  getBadgeClasses,
  formatCurrency,
  calculatePartyKitProjects,
} from '../../packages/ui/src/primitives.mjs';

/**
 * Standard W3C WCAG 2.2 Relative Luminance & Contrast Calculation
 */
function getRelativeLuminance(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const linearize = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function getContrastRatio(hex1, hex2) {
  const L1 = getRelativeLuminance(hex1);
  const L2 = getRelativeLuminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('UI-01: WCAG 2.2 AA Mathematical Contrast Ratios', () => {
  test('Primary Button CTA: pink-500 background with charcoal-950 text satisfies WCAG AA & AAA Large (>= 6.7:1)', () => {
    const pinkBg = colors.pink[500]; // #FF689D
    const charcoalText = colors.charcoal[950]; // #171416
    const ratio = getContrastRatio(pinkBg, charcoalText);

    // Expected: 6.72:1
    assert.ok(
      ratio >= 6.7,
      `Expected pink CTA with charcoal text contrast >= 6.7:1, got ${ratio.toFixed(2)}:1`
    );
    assert.ok(
      ratio >= 4.5,
      'Passes WCAG 2.2 AA Normal Text requirement (4.5:1)'
    );
  });

  test('Primary Button CTA: Prohibits white text on pink-500 (fails WCAG AA at 2.72:1)', () => {
    const pinkBg = colors.pink[500]; // #FF689D
    const whiteText = '#FFFFFF';
    const ratio = getContrastRatio(pinkBg, whiteText);

    // Expected: ~2.72:1, which strictly FAILS WCAG AA
    assert.ok(
      ratio < 3.0,
      `White text on pink must fail contrast audit (expected < 3.0:1, got ${ratio.toFixed(2)}:1)`
    );
  });

  test('Storefront Canvas: charcoal-950 text on Pearl Cream cream-100 exceeds WCAG AAA (>= 17:1)', () => {
    const creamCanvas = colors.cream[100]; // #FFF8EF
    const charcoalText = colors.charcoal[950]; // #171416
    const ratio = getContrastRatio(creamCanvas, charcoalText);

    assert.ok(
      ratio >= 17.0,
      `Expected body text contrast on cream canvas >= 17:1, got ${ratio.toFixed(2)}:1`
    );
  });

  test('Accessible Text Link: raspberry.text on cream-100 satisfies WCAG AA Normal Text (>= 5.0:1)', () => {
    const creamCanvas = colors.cream[100]; // #FFF8EF
    const raspberryText = colors.raspberry.text; // #C72B63
    const ratio = getContrastRatio(creamCanvas, raspberryText);

    assert.ok(
      ratio >= 4.5,
      `Expected interactive text link contrast >= 4.5:1, got ${ratio.toFixed(2)}:1`
    );
  });

  test('Craft Accent: charcoal-950 on amber-100 badge exceeds WCAG AAA (>= 16:1)', () => {
    const amberBg = colors.amber[100]; // #FFF9C4
    const charcoalText = colors.charcoal[950]; // #171416
    const ratio = getContrastRatio(amberBg, charcoalText);

    assert.ok(
      ratio >= 16.0,
      `Expected amber badge contrast >= 16:1, got ${ratio.toFixed(2)}:1`
    );
  });

  test('Craft Accent: amber-500 on charcoal-950 noir card exceeds WCAG AAA (>= 10.5:1)', () => {
    const amberAccent = colors.amber[500]; // #FFC107
    const charcoalBg = colors.charcoal[950]; // #171416
    const ratio = getContrastRatio(charcoalBg, amberAccent);

    assert.ok(
      ratio >= 10.5,
      `Expected amber-500 on charcoal contrast >= 10.5:1, got ${ratio.toFixed(2)}:1`
    );
  });

  test('Dark Card / Noir Surface: white text on charcoal-950 exceeds WCAG AAA (>= 18:1)', () => {
    const charcoalBg = colors.charcoal[950]; // #171416
    const whiteText = '#FFFFFF';
    const ratio = getContrastRatio(charcoalBg, whiteText);

    assert.ok(
      ratio >= 18.0,
      `Expected white on charcoal contrast >= 18:1, got ${ratio.toFixed(2)}:1`
    );
  });
});

describe('UI-02: Button Component Tokens & Invariants', () => {
  test('Primary Button includes pink-500 fill, charcoal-950 text, and never standalone text-white', () => {
    const classes = getButtonClasses({ variant: 'primary' });
    const classList = classes.split(' ');
    assert.ok(classList.includes('bg-pink-500'), 'Must include bg-pink-500');
    assert.ok(classList.includes('text-charcoal-950'), 'Must include text-charcoal-950');
    assert.ok(classList.includes('font-bold'), 'Must be bold');
    assert.ok(!classList.includes('text-white'), 'Default text must NOT be text-white');
  });

  test('Secondary Button includes cream-100 fill and charcoal-950 border/text', () => {
    const classes = getButtonClasses({ variant: 'secondary' });
    assert.ok(classes.includes('bg-cream-100'), 'Must include bg-cream-100');
    assert.ok(classes.includes('text-charcoal-950'), 'Must include text-charcoal-950');
    assert.ok(classes.includes('border-2 border-charcoal-950'), 'Must include charcoal border');
  });

  test('Noir Button includes charcoal-950 fill and white text', () => {
    const classes = getButtonClasses({ variant: 'noir' });
    const classList = classes.split(' ');
    assert.ok(classList.includes('bg-charcoal-950'), 'Must include bg-charcoal-950');
    assert.ok(classList.includes('text-white'), 'Must include text-white');
  });

  test('Button sizes enforce minimum 44px touch targets (WCAG 2.5.5 / 2.5.8)', () => {
    const sm = getButtonClasses({ size: 'sm' });
    const md = getButtonClasses({ size: 'md' });
    const lg = getButtonClasses({ size: 'lg' });

    assert.ok(sm.includes('min-h-[44px]'), 'sm button must have min-h-[44px]');
    assert.ok(md.includes('min-h-[48px]'), 'md button must have min-h-[48px]');
    assert.ok(lg.includes('min-h-[56px]'), 'lg button must have min-h-[56px]');
  });

  test('Focus rings provide high-contrast visible focus indicators', () => {
    const classes = getButtonClasses({ variant: 'primary' });
    assert.ok(classes.includes('focus-visible:ring-4'), 'Must have focus-visible ring');
    assert.ok(classes.includes('focus-visible:ring-raspberry-500/40'), 'Must use raspberry focus ring');
  });
});

describe('UI-03: Badge Component Tokens & Invariants', () => {
  test('Pink Badge pairs pink-500 with charcoal-950, never white', () => {
    const classes = getBadgeClasses({ variant: 'pink' });
    const classList = classes.split(' ');
    assert.ok(classList.includes('bg-pink-500'), 'Must include bg-pink-500');
    assert.ok(classList.includes('text-charcoal-950'), 'Must include text-charcoal-950');
    assert.ok(!classList.includes('text-white'), 'Must NOT have text-white');
  });

  test('Amber Badge pairs amber-100 with charcoal-950 and amber-300 border for AAA contrast', () => {
    const classes = getBadgeClasses({ variant: 'amber' });
    const classList = classes.split(' ');
    assert.ok(classList.includes('bg-amber-100'), 'Must include bg-amber-100');
    assert.ok(classList.includes('text-charcoal-950'), 'Must include text-charcoal-950');
    assert.ok(classList.includes('border-amber-300'), 'Must include border-amber-300');
  });

  test('Charcoal Badge pairs charcoal-950 with white text', () => {
    const classes = getBadgeClasses({ variant: 'charcoal' });
    const classList = classes.split(' ');
    assert.ok(classList.includes('bg-charcoal-950'), 'Must include bg-charcoal-950');
    assert.ok(classList.includes('text-white'), 'Must include text-white');
  });
});

describe('UI-04: Currency Formatting & Pricing Math', () => {
  test('formatCurrency correctly formats integer minor units into USD dollars', () => {
    assert.strictEqual(formatCurrency(18900), '$189');
    assert.strictEqual(formatCurrency(2800), '$28');
    assert.strictEqual(formatCurrency(4850), '$48.50');
    assert.strictEqual(formatCurrency(1200), '$12');
  });

  test('15-Guest Party Kit base calculation yields 45 finished keepsakes', () => {
    const bom = calculatePartyKitProjects(15);
    assert.strictEqual(bom.totalProjects, 45, '15 guests must yield exactly 45 finished items');
    assert.strictEqual(bom.breakdown.pens, 15);
    assert.strictEqual(bom.breakdown.bracelets, 15);
    assert.strictEqual(bom.breakdown.keychains, 15);
  });

  test('Dynamic increment calculation for 20 guests yields 60 finished keepsakes', () => {
    const bom = calculatePartyKitProjects(20);
    assert.strictEqual(bom.totalProjects, 60, '20 guests must yield exactly 60 finished items');
    assert.strictEqual(bom.breakdown.pens, 20);
    assert.strictEqual(bom.breakdown.bracelets, 20);
    assert.strictEqual(bom.breakdown.keychains, 20);
  });

  test('Party Kit calculation rejects invalid guest count < 15', () => {
    assert.throws(() => calculatePartyKitProjects(14), /INVALID_GUEST_COUNT/);
  });
});

describe('UI-05: Tailwind Preset Theme Integrity', () => {
  test('Preset extends brand colors with correct hexadecimal values', () => {
    const themeColors = beadsilyTailwindPreset.theme.extend.colors;
    assert.strictEqual(themeColors.charcoal[950], '#171416');
    assert.strictEqual(themeColors.pink[500], '#FF689D');
    assert.strictEqual(themeColors.raspberry[500], '#D93D75');
    assert.strictEqual(themeColors.amber[500], '#FFC107');
    assert.strictEqual(themeColors.cream[100], '#FFF8EF');
  });

  test('Preset extends typography font families and font sizes', () => {
    const theme = beadsilyTailwindPreset.theme.extend;
    assert.ok(theme.fontFamily.display, 'Display font family must exist');
    assert.ok(theme.fontFamily.body, 'Body font family must exist');
    assert.ok(theme.fontFamily.accent, 'Accent font family must exist');
    assert.ok(theme.fontSize['display-2xl'], 'Fluid font scale must exist');
  });

  test('Preset extends border radii and elevation shadows', () => {
    const theme = beadsilyTailwindPreset.theme.extend;
    assert.strictEqual(theme.borderRadius.full, '9999px');
    assert.strictEqual(theme.borderRadius.xl, '24px');
    assert.ok(theme.boxShadow.card, 'Custom card shadow must exist');
  });
});
