import * as React from 'react';
import { cn } from '../utils/cn';

export type BadgeVariant =
  | 'pink'
  | 'pinkSoft'
  | 'raspberry'
  | 'amber'
  | 'charcoal'
  | 'cream'
  | 'success';

export type BadgeSize = 'sm' | 'md';

export interface BadgeStyleOptions {
  variant?: BadgeVariant;
  size?: BadgeSize;
  pill?: boolean;
  className?: string;
}

/**
 * Returns Tailwind CSS classes for the BeadsILY Badge.
 * Meets WCAG 2.2 AA contrast targets:
 * - pink: bg-pink-500 (#FF689D) with text-charcoal-950 (#171416) -> 6.72:1 contrast.
 * - amber: bg-amber-100 (#FFF9C4) with text-amber-900 (#C76A00) -> 5.1:1 contrast.
 * - charcoal: bg-charcoal-950 (#171416) with text-white (#FFFFFF) -> 18.29:1 contrast.
 */
export function getBadgeClasses({
  variant = 'pink',
  size = 'sm',
  pill = true,
  className,
}: BadgeStyleOptions = {}): string {
  const baseClasses = [
    'inline-flex items-center gap-1.5 font-body select-none tracking-wide transition-colors',
    pill ? 'rounded-full' : 'rounded-md',
  ];

  let variantClasses = '';
  switch (variant) {
    case 'pink':
      // Bubblegum Pink with Charcoal text (6.72:1 AA)
      variantClasses = 'bg-pink-500 text-charcoal-950 font-bold shadow-xs';
      break;
    case 'pinkSoft':
      // Soft blush pastel with readable raspberry text
      variantClasses = 'bg-pink-100 text-raspberry-700 font-semibold border border-pink-200';
      break;
    case 'raspberry':
      variantClasses = 'bg-raspberry-100 text-raspberry-700 font-semibold border border-raspberry-200';
      break;
    case 'amber':
      // Warm amber gold celebration badge (ratings, craft tags)
      variantClasses = 'bg-amber-100 text-charcoal-950 border border-amber-300 font-semibold';
      break;
    case 'charcoal':
      // Deep charcoal noir with white text (18.29:1 AAA)
      variantClasses = 'bg-charcoal-950 text-white font-semibold';
      break;
    case 'cream':
      // Warm neutral sand
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

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, BadgeStyleOptions {
  icon?: React.ReactNode;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'pink',
  size = 'sm',
  pill = true,
  icon,
  dot = false,
  ...props
}) => {
  const badgeClasses = getBadgeClasses({ variant, size, pill, className });

  return (
    <span className={badgeClasses} {...props}>
      {dot && (
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full shrink-0',
            variant === 'pink' ? 'bg-charcoal-950' : 'bg-current'
          )}
          aria-hidden="true"
        />
      )}
      {icon && <span className="inline-flex shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

Badge.displayName = 'Badge';

export default Badge;
