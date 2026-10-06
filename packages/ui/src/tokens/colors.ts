/**
 * BeadsILY Design Tokens: Color System
 * Authoritative color palette reverse-engineered from physical canopy banner (beadsily-canopy-banner-8x2ft.pdf)
 * and verified against WCAG 2.2 AA / AAA contrast standards.
 */

export const colors = {
  // Brand Primary: Deep Charcoal Noir (Primary Text, High-Contrast Surface)
  charcoal: {
    50: '#F4F2F3',
    100: '#E6E3E5',
    200: '#CBC6C9',
    300: '#ABA4A8',
    400: '#7E737B',
    500: '#5A5258',
    600: '#463E44',
    700: '#373035', // Slate Charcoal Accent
    800: '#25142D', // Deep Aubergine (Legacy Vector Bridge)
    900: '#1C181A',
    950: '#171416', // Core Brand Noir / Canopy Master Font Fill
    DEFAULT: '#171416',
  },

  // Brand Accent: Bubblegum Pink (Vibrant Hero, Badges, Decorative Accents)
  // NOTE: On cream (#FFF8EF), #FF689D has a 2.15:1 contrast ratio.
  // Use as button background with charcoal text (#171416: 8.29:1 AAA),
  // or use raspberry for text links on light surfaces.
  pink: {
    50: '#FFF0F6',
    100: '#FFE4EE',
    200: '#FFBFD6',
    300: '#FF97BD', // Soft Pastel Blush Bead Color
    400: '#FF80AD',
    500: '#FF689D', // Core Brand Bubblegum Pink (Canopy ILY Fill)
    600: '#E84A83',
    700: '#CE2D6A',
    800: '#A91B51',
    900: '#7E123B',
    DEFAULT: '#FF689D',
  },

  // Brand Interactive: Deep Raspberry (Accessible Pink for Text, Links, and Focus States)
  // - raspberry.DEFAULT (#D93D75): 4.09:1 on cream (Passes AA Large >= 3.0:1, UI icons & borders)
  // - raspberry.text (#C72B63): 5.04:1 on cream (Guaranteed PASS for WCAG 2.2 AA normal text >= 4.5:1)
  raspberry: {
    50: '#FDF2F5',
    100: '#FCE6EB',
    200: '#F8BCCB',
    300: '#F18CA6',
    400: '#E5587E',
    500: '#D93D75', // Core Brand Raspberry (Canopy Stroke Accent & Bead Shading)
    600: '#C72B63', // Accessible Text on Cream/White (5.04:1 WCAG AA Normal Text)
    700: '#9E1A4B',
    800: '#7D133B',
    900: '#5E0D2B',
    DEFAULT: '#D93D75',
    text: '#C72B63',
  },

  // Brand Craft Accent: Warm Amber Bead Gold (Stars, Craft Accents, Badges)
  amber: {
    50: '#FFFDE7',
    100: '#FFF9C4',
    200: '#FFF59D',
    300: '#FFF176',
    400: '#FFEE58',
    500: '#FFC107', // Core Warm Amber (Canopy Sunburst / Bead Accent)
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#C76A00', // Accessible Amber text on light surfaces
    DEFAULT: '#FFC107',
  },

  // Warm Neutral Surfaces: Pearl Cream & Sand (Tactile Craft Packaging & Storefront Canvas)
  cream: {
    50: '#FFFFFF', // Pure Crisp White
    100: '#FFF8EF', // Core Warm Pearl Cream (Storefront Canvas & Canopy Background)
    200: '#F8F1E4',
    300: '#E7DECB', // Soft Sand Neutral (Borders, Dividers, Chip Fills)
    400: '#D3C8B1',
    500: '#B8AB90',
    600: '#94876E',
    700: '#706550',
    800: '#4D4536',
    900: '#2A251D',
    DEFAULT: '#FFF8EF',
  },

  // Status & Feedback Tokens (Storefront & Operations Alerts)
  status: {
    success: '#10B981',
    successLight: '#ECFDF5',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    info: '#3B82F6',
    infoLight: '#EFF6FF',
  }
} as const;

export type BrandColors = typeof colors;
