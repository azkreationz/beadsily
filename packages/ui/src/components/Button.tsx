import * as React from 'react';
import { cn } from '../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'noir' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

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
  className,
}: ButtonStyleOptions = {}): string {
  const baseClasses = [
    'inline-flex items-center justify-center gap-2 font-body font-semibold select-none transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-raspberry-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100',
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
  ];

  // Shape: default bubblegum pill or rounded rectangle
  const shapeClasses = pill ? 'rounded-full' : 'rounded-xl';

  // Variant styling
  let variantClasses = '';
  switch (variant) {
    case 'primary':
      // Brand Bubblegum Pink with Charcoal Noir text (6.72:1 WCAG AA/AAA)
      variantClasses =
        'bg-pink-500 text-charcoal-950 font-bold hover:bg-pink-400 active:bg-raspberry-600 active:text-white shadow-sm hover:shadow active:scale-[0.98]';
      break;
    case 'secondary':
      // Pearl Cream with Charcoal Noir border & text (17.36:1 WCAG AAA)
      variantClasses =
        'bg-cream-100 text-charcoal-950 border-2 border-charcoal-950 hover:bg-cream-200 active:bg-cream-300 active:scale-[0.98]';
      break;
    case 'noir':
      // Charcoal Noir with Pure White text (18.29:1 WCAG AAA)
      variantClasses =
        'bg-charcoal-950 text-white font-bold border-2 border-charcoal-950 hover:bg-charcoal-800 active:bg-charcoal-900 shadow-sm active:scale-[0.98]';
      break;
    case 'outline':
      // Transparent background with Charcoal Noir border & text
      variantClasses =
        'bg-transparent text-charcoal-950 border-2 border-charcoal-950 hover:bg-cream-200 active:bg-cream-300';
      break;
    case 'ghost':
      // Subtle background on hover
      variantClasses = 'bg-transparent text-charcoal-950 hover:bg-cream-200 active:bg-cream-300';
      break;
    case 'link':
      // Accessible Raspberry inline link (5.04:1 WCAG AA)
      variantClasses =
        'bg-transparent text-raspberry-600 hover:text-raspberry-700 underline underline-offset-4 p-0 min-h-0 min-w-0 font-semibold';
      break;
  }

  // Size styling ensuring minimum 44x44px touch targets (WCAG 2.5.5 / 2.5.8)
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

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonStyleOptions {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      pill = true,
      fullWidth = false,
      disabled = false,
      loading = false,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const buttonClasses = getButtonClasses({
      variant,
      size,
      pill,
      fullWidth,
      disabled,
      loading,
      className,
    });

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            role="status"
            aria-label="Loading"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!loading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
