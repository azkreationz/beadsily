/**
 * BeadsILY Storefront UI Primitives & Token Library (ESM)
 * Zero-dependency pure JavaScript runtime export for tests, SSR, and build tooling.
 * Strictly adheres to WCAG 2.2 Level AA / AAA standards per docs/brand/CONTRAST-VERIFICATION.md.
 */

import { cn } from './utils/cn.js';

// Re-export design tokens
export { colors } from './tokens/colors.js';
export { typography } from './tokens/typography.js';
export { spacing } from './tokens/spacing.js';
export { beadsilyTailwindPreset } from './tailwind.preset.js';

/**
 * Returns Tailwind CSS classes for the BeadsILY Button.
 * Strictly adheres to WCAG 2.2 AA / AAA contrast specifications:
 * - Primary: bg-pink-500 (#FF689D) with text-charcoal-950 (#171416) -> 6.72:1 contrast ratio.
 *   CRITICAL: NEVER pair pink-500 with text-white (fails at 2.72:1).
 * - Secondary: bg-cream-100 (#FFF8EF) with text-charcoal-950 (#171416) -> 17.36:1 contrast ratio.
 * - Noir: bg-charcoal-950 (#171416) with text-white (#FFFFFF) -> 18.29:1 contrast ratio.
 * - Link: text-raspberry-600 (#C72B63) on light surfaces -> 5.04:1 contrast ratio.
 */
export function getButtonClasses({
  variant = 'primary',
  size = 'md',
  pill = true,
  fullWidth = false,
  disabled = false,
  loading = false,
  className = '',
} = {}) {
  const baseClasses = [
    'inline-flex items-center justify-center gap-2 font-body font-semibold select-none transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-raspberry-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100',
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
  ];

  const shapeClasses = pill ? 'rounded-full' : 'rounded-xl';

  let variantClasses = '';
  switch (variant) {
    case 'primary':
      // Bubblegum Pink with Charcoal Noir text (6.72:1 AA / AAA Large)
      variantClasses =
        'bg-pink-500 text-charcoal-950 font-bold hover:bg-pink-400 active:bg-raspberry-600 active:text-white shadow-sm hover:shadow active:scale-[0.98]';
      break;
    case 'secondary':
      // Pearl Cream with Charcoal Noir border & text (17.36:1 AAA)
      variantClasses =
        'bg-cream-100 text-charcoal-950 border-2 border-charcoal-950 hover:bg-cream-200 active:bg-cream-300 active:scale-[0.98]';
      break;
    case 'noir':
      // Charcoal Noir with Pure White text (18.29:1 AAA)
      variantClasses =
        'bg-charcoal-950 text-white font-bold border-2 border-charcoal-950 hover:bg-charcoal-800 active:bg-charcoal-900 shadow-sm active:scale-[0.98]';
      break;
    case 'outline':
      variantClasses =
        'bg-transparent text-charcoal-950 border-2 border-charcoal-950 hover:bg-cream-200 active:bg-cream-300';
      break;
    case 'ghost':
      variantClasses = 'bg-transparent text-charcoal-950 hover:bg-cream-200 active:bg-cream-300';
      break;
    case 'link':
      // Accessible Raspberry inline link (5.04:1 AA)
      variantClasses =
        'bg-transparent text-raspberry-600 hover:text-raspberry-700 underline underline-offset-4 p-0 min-h-0 min-w-0 font-semibold';
      break;
  }

  let sizeClasses = '';
  if (variant === 'link') {
    sizeClasses = '';
  } else {
    switch (size) {
      case 'sm':
        sizeClasses = 'min-h-[44px] min-w-[44px] px-4 py-2 text-sm';
        break;
      case 'md':
        sizeClasses = 'min-h-[48px] px-6 py-3 text-base';
        break;
      case 'lg':
        sizeClasses = 'min-h-[56px] px-8 py-4 text-lg font-bold';
        break;
    }
  }

  return cn(...baseClasses, variant !== 'link' && shapeClasses, variantClasses, sizeClasses, className);
}

/**
 * Returns Tailwind CSS classes for the BeadsILY Badge.
 * Meets WCAG 2.2 AA contrast targets:
 * - pink: bg-pink-500 (#FF689D) with text-charcoal-950 (#171416) -> 6.72:1 contrast.
 * - amber: bg-amber-100 (#FFF9C4) with text-charcoal-950 (#171416) -> 17.3:1 contrast.
 * - charcoal: bg-charcoal-950 (#171416) with text-white (#FFFFFF) -> 18.29:1 contrast.
 */
export function getBadgeClasses({
  variant = 'pink',
  size = 'sm',
  pill = true,
  className = '',
} = {}) {
  const baseClasses = [
    'inline-flex items-center gap-1.5 font-body select-none tracking-wide transition-colors',
    pill ? 'rounded-full' : 'rounded-md',
  ];

  let variantClasses = '';
  switch (variant) {
    case 'pink':
      variantClasses = 'bg-pink-500 text-charcoal-950 font-bold shadow-xs';
      break;
    case 'pinkSoft':
      variantClasses = 'bg-pink-100 text-raspberry-700 font-semibold border border-pink-200';
      break;
    case 'raspberry':
      variantClasses = 'bg-raspberry-100 text-raspberry-700 font-semibold border border-raspberry-200';
      break;
    case 'amber':
      variantClasses = 'bg-amber-100 text-charcoal-950 border border-amber-300 font-semibold';
      break;
    case 'charcoal':
      variantClasses = 'bg-charcoal-950 text-white font-semibold';
      break;
    case 'cream':
      variantClasses = 'bg-cream-200 text-charcoal-950 border border-cream-300 font-medium';
      break;
    case 'success':
      variantClasses = 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200';
      break;
  }

  let sizeClasses = '';
  switch (size) {
    case 'sm':
      sizeClasses = 'text-xs px-2.5 py-0.5';
      break;
    case 'md':
      sizeClasses = 'text-sm px-3.5 py-1';
      break;
  }

  return cn(...baseClasses, variantClasses, sizeClasses, className);
}

/**
 * Format integer minor units (cents) into formatted currency.
 * $18900 -> $189, $4850 -> $48.50
 */
export function formatCurrency(cents, currency = 'USD') {
  const dollars = cents / 100;
  const hasCents = cents % 100 !== 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Calculate total project count for 15+ guest party kits.
 * Invariant: Every kit guarantees 3 finished projects per guest.
 */
export function calculatePartyKitProjects(guestCount) {
  if (typeof guestCount !== 'number' || guestCount < 15) {
    throw new Error('INVALID_GUEST_COUNT: Minimum party kit size is 15 guests');
  }
  return {
    guestCount,
    projectsPerGuest: 3,
    totalProjects: guestCount * 3,
    breakdown: {
      pens: guestCount,
      bracelets: guestCount,
      keychains: guestCount,
    },
  };
}
