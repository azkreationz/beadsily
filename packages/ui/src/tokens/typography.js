/**
 * BeadsILY Design Tokens: Typography System (JavaScript)
 */

export const typography = {
  fonts: {
    display: [
      '"Playfair Display"',
      '"Cormorant Garamond"',
      'Georgia',
      'Cambria',
      '"Times New Roman"',
      'serif',
    ].join(', '),

    accent: [
      '"Plus Jakarta Sans"',
      '"Outfit"',
      '-apple-system',
      'BlinkMacSystemFont',
      'sans-serif',
    ].join(', '),

    body: [
      '"Inter"',
      '"Plus Jakarta Sans"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(', '),

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

  fontSize: {
    'display-2xl': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
    'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '700' }],
    'display-lg': ['3.0rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
    'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],
    'display-sm': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
    'heading-xl': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
    'heading-lg': ['1.25rem', { lineHeight: '1.35', letterSpacing: '0em', fontWeight: '600' }],
    'heading-md': ['1.125rem', { lineHeight: '1.4', letterSpacing: '0em', fontWeight: '600' }],
    'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0em', fontWeight: '400' }],
    'body-md': ['1.0rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],
    'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em', fontWeight: '400' }],
    'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],
    'tagline': ['0.8125rem', { lineHeight: '1.4', letterSpacing: '0.12em', fontWeight: '700' }],
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '800',
  },
};
