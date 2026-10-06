import * as React from 'react';
import { cn } from '../utils/cn';
import { Button } from './Button';
import { Badge, type BadgeVariant } from './Badge';

export interface HeroBannerProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  tagline?: string;
  badge?: {
    label: string;
    variant?: BadgeVariant;
  };
  primaryCta: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryCta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  theme?: 'cream' | 'charcoal';
  features?: Array<{
    title: string;
    desc: string;
  }>;
  announcement?: string;
  className?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  subtitle,
  tagline = 'BRACELETS • KEYCHAINS • BEADABLES',
  badge,
  primaryCta,
  secondaryCta,
  theme = 'cream',
  features,
  announcement,
  className,
}) => {
  const isDark = theme === 'charcoal';

  return (
    <section
      className={cn(
        'relative overflow-hidden py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 transition-colors',
        isDark ? 'bg-charcoal-950 text-white' : 'bg-cream-100 text-charcoal-950',
        className
      )}
    >
      {/* Decorative bead garland accent in background */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{
          background: isDark
            ? 'radial-gradient(circle, #FF689D 0%, transparent 70%)'
            : 'radial-gradient(circle, #FFC107 0%, #FF689D 50%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl">
        {/* Announcement Pill if present */}
        {announcement && (
          <div className="mb-6 flex justify-center sm:justify-start">
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold shadow-xs',
                isDark
                  ? 'bg-charcoal-800 text-cream-100 border border-charcoal-700'
                  : 'bg-white text-charcoal-950 border border-cream-300'
              )}
            >
              <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" aria-hidden="true" />
              <span>{announcement}</span>
            </div>
          </div>
        )}

        {/* Small caps Tagline */}
        {tagline && (
          <p
            className={cn(
              'font-body text-xs sm:text-sm font-bold uppercase tracking-widest mb-3',
              isDark ? 'text-pink-400' : 'text-raspberry-600'
            )}
          >
            {tagline}
          </p>
        )}

        {/* Hero Title */}
        <h1
          className={cn(
            'font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight',
            isDark ? 'text-white' : 'text-charcoal-950'
          )}
        >
          {title}
        </h1>

        {/* Subtitle */}
        <p
          className={cn(
            'font-body text-base sm:text-xl max-w-2xl mb-8 leading-relaxed',
            isDark ? 'text-cream-100' : 'text-charcoal-700'
          )}
        >
          {subtitle}
        </p>

        {/* CTA Buttons Group */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-12">
          {primaryCta.href ? (
            <a href={primaryCta.href} className="inline-block">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                aria-label={primaryCta.label}
              >
                {primaryCta.label}
              </Button>
            </a>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={primaryCta.onClick}
              aria-label={primaryCta.label}
            >
              {primaryCta.label}
            </Button>
          )}

          {secondaryCta && (
            secondaryCta.href ? (
              <a href={secondaryCta.href} className="inline-block">
                <Button
                  variant={isDark ? 'secondary' : 'noir'}
                  size="lg"
                  fullWidth
                  aria-label={secondaryCta.label}
                >
                  {secondaryCta.label}
                </Button>
              </a>
            ) : (
              <Button
                variant={isDark ? 'secondary' : 'noir'}
                size="lg"
                onClick={secondaryCta.onClick}
                aria-label={secondaryCta.label}
              >
                {secondaryCta.label}
              </Button>
            )
          )}
        </div>

        {/* Feature Pillars Grid */}
        {features && features.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-cream-300/60">
            {features.map((feature, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      isDark ? 'bg-pink-500 text-charcoal-950' : 'bg-raspberry-600 text-white'
                    )}
                  >
                    ✓
                  </span>
                  <h3
                    className={cn(
                      'font-accent font-bold text-base',
                      isDark ? 'text-white' : 'text-charcoal-950'
                    )}
                  >
                    {feature.title}
                  </h3>
                </div>
                <p
                  className={cn(
                    'text-sm leading-normal',
                    isDark ? 'text-cream-300' : 'text-charcoal-700'
                  )}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

HeroBanner.displayName = 'HeroBanner';

export default HeroBanner;
