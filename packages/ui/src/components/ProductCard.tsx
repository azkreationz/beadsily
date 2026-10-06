import * as React from 'react';
import { cn } from '../utils/cn';
import { Button } from './Button';
import { Badge, type BadgeVariant } from './Badge';

export interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceInCents: number;
  originalPriceInCents?: number;
  imageUrl?: string;
  imageAlt?: string;
  badge?: {
    label: string;
    variant?: BadgeVariant;
  };
  category?: 'party-kit' | 'mystery-box' | 'monthly-box' | 'finished-good';
  guestCount?: number;
  projectsPerGuest?: number;
  totalFinishedProjects?: number;
  guaranteedProjectsCount?: number;
  guaranteedItemsSummary?: string[];
  stockStatus?: 'in_stock' | 'low_stock' | 'prepacked_sealed' | 'sold_out';
  stockCount?: number;
  onCtaClick?: (productId: string) => void;
  ctaLabel?: string;
  className?: string;
  href?: string;
}

/**
 * Format integer minor units (cents) into formatted currency.
 */
export function formatCurrency(cents: number, currency: string = 'USD'): string {
  const dollars = cents / 100;
  const hasCents = cents % 100 !== 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  slug,
  title,
  description,
  priceInCents,
  originalPriceInCents,
  imageUrl,
  imageAlt,
  badge,
  category = 'party-kit',
  guestCount,
  projectsPerGuest = 3,
  totalFinishedProjects,
  guaranteedProjectsCount,
  guaranteedItemsSummary,
  stockStatus = 'in_stock',
  stockCount,
  onCtaClick,
  ctaLabel,
  className,
  href,
}) => {
  const isPartyKit = category === 'party-kit' || guestCount !== undefined;
  const isMystery = category === 'mystery-box';
  const computedTotalProjects = totalFinishedProjects || (guestCount ? guestCount * projectsPerGuest : undefined);

  const defaultCtaLabel = isPartyKit
    ? 'Customize 15-Guest Kit'
    : isMystery
    ? 'Select Mystery Box'
    : 'Add to Bag';

  const actionLabel = ctaLabel || defaultCtaLabel;

  return (
    <article
      className={cn(
        'group flex flex-col rounded-2xl border-2 border-cream-300 bg-white overflow-hidden shadow-card transition-all duration-200',
        'hover:border-raspberry-500 hover:shadow-lg',
        className
      )}
    >
      {/* Product Image / Media Area */}
      <div className="relative aspect-4/3 w-full bg-cream-100 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt || title}
            loading="lazy"
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-charcoal-700">
            {/* Bead garland illustration placeholder */}
            <svg
              className="h-12 w-12 text-pink-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">
              {category.replace('-', ' ')}
            </span>
          </div>
        )}

        {/* Badge Overlay */}
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant={badge.variant || 'pink'} size="sm">
              {badge.label}
            </Badge>
          </div>
        )}

        {/* Stock / Sealed Indicator */}
        {stockStatus === 'prepacked_sealed' && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="charcoal" size="sm">
              Prepacked Unit
            </Badge>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-5 sm:p-6 justify-between">
        <div>
          {/* Category & Project Spec Chip */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {isPartyKit && computedTotalProjects && (
              <span className="inline-flex items-center text-xs font-bold text-raspberry-700 bg-pink-100 px-2.5 py-0.5 rounded-full">
                {guestCount || 15} Guests • {computedTotalProjects} Projects
              </span>
            )}
            {isMystery && guaranteedProjectsCount && (
              <span className="inline-flex items-center text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                Guaranteed: {guaranteedProjectsCount} Projects
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-accent font-bold text-heading-md text-charcoal-950 mb-2 leading-snug group-hover:text-raspberry-700 transition-colors">
            {href ? (
              <a href={href} className="focus:outline-none focus:underline">
                {title}
              </a>
            ) : (
              title
            )}
          </h3>

          {/* Description */}
          <p className="text-body-sm text-charcoal-700 mb-4 line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* Included Items Summary (Guaranteed project disclosure) */}
          {guaranteedItemsSummary && guaranteedItemsSummary.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-cream-100 border border-cream-300 text-xs text-charcoal-950">
              <span className="font-semibold block mb-1">Guaranteed Supplies:</span>
              <ul className="list-disc list-inside space-y-0.5 text-charcoal-700">
                {guaranteedItemsSummary.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Pricing & Footer Actions */}
        <div className="pt-4 border-t border-cream-300 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-accent font-bold text-heading-xl text-charcoal-950">
                {formatCurrency(priceInCents)}
              </span>
              {originalPriceInCents && originalPriceInCents > priceInCents && (
                <span className="text-sm text-charcoal-500 line-through">
                  {formatCurrency(originalPriceInCents)}
                </span>
              )}
            </div>

            {guestCount && (
              <span className="text-xs text-charcoal-700 font-medium">
                {formatCurrency(Math.round(priceInCents / guestCount))}/guest
              </span>
            )}
          </div>

          {/* CTA Button */}
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => onCtaClick && onCtaClick(id)}
            disabled={stockStatus === 'sold_out'}
            aria-label={`${actionLabel} for ${title}`}
          >
            {stockStatus === 'sold_out' ? 'Sold Out' : actionLabel}
          </Button>
        </div>
      </div>
    </article>
  );
};

ProductCard.displayName = 'ProductCard';

export default ProductCard;
