/**
 * BeadsILY Design Tokens: Typography System
 * Reconciled from canopy banner display serif letterforms ("BEADS"),
 * playful geometric accents ("ILY"), and small caps sans-serif tagline ("BRACELETS • KEYCHAINS • BEADABLES").
 */

export const typography = {
  fonts: {
    // Primary Display / Editorial: Elegant high-contrast serif matching "BEADS" display lettering
    // High aesthetic appeal for adult gift-buyers and celebratory party occasions.
    display: [
      '"Playfair Display"',
      '"Cormorant Garamond"',
      'Georgia',
      'Cambria',
      '"Times New Roman"',
      'serif',
    ].join(', '),

    // Secondary Heading & Wordmark Accent: High-energy humanist display sans matching "ILY"
    accent: [
      '"Plus Jakarta Sans"',
      '"Outfit"',
      '-apple-system',
      'BlinkMacSystemFont',
      'sans-serif',
    ].join(', '),

    // Body & Interface: Clean, hyper-legible geometric sans for shopping, forms, and instructions
    body: [
      '"Inter"',
      '"Plus Jakarta Sans"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(', '),

    // Monospace: BOM SKU codes, order IDs, inventory bin coordinates
    mono: [
      '"JetBrains Mono"',
      'ui-monospace',
      'SFMono-Regular',
      'Menlo',
      'Monaco',
      'Consolas',
      'monospace',
    ].join(', '),
  },

  // Font Size Scale with fluid line heights and tracking
  fontSize: {
    'display-2xl': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }], // 72px Hero
    'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '700' }], // 60px
    'display-lg': ['3.0rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],  // 48px
    'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }], // 36px
    'display-sm': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],// 30px
    'heading-xl': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],    // 24px
    'heading-lg': ['1.25rem', { lineHeight: '1.35', letterSpacing: '0em', fontWeight: '600' }],      // 20px
    'heading-md': ['1.125rem', { lineHeight: '1.4', letterSpacing: '0em', fontWeight: '600' }],     // 18px
    'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0em', fontWeight: '400' }],        // 18px
    'body-md': ['1.0rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],          // 16px Base
    'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em', fontWeight: '400' }],      // 14px
    'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],       // 12px
    'tagline': ['0.8125rem', { lineHeight: '1.4', letterSpacing: '0.12em', fontWeight: '700' }],     // Small caps banner tracking
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '800',
  },
} as const;

export type BrandTypography = typeof typography;
