'use client';

import * as React from 'react';
import {
  Button,
  QuantitySelector,
  Badge,
  formatCurrency,
  cn,
} from '@beadsily/ui';

export interface ThemeOption {
  id: string;
  name: string;
  tagline: string;
  paletteColors: string[];
  focalSummary: string;
  defaultHardware: 'silver' | 'rose-gold' | 'gold';
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'taylor-era',
    name: "Taylor's Era Friendship",
    tagline: 'Friendship bead bar with heart sunglasses & glitter disco beads',
    paletteColors: ['#FF689D', '#CBC6C9', '#E6E3E5', '#FDF2F5'],
    focalSummary: 'Heart Sunglasses + Glitter Disco Balls',
    defaultHardware: 'silver',
  },
  {
    id: 'boho-bloom',
    name: 'Desert Bloom & Boho',
    tagline: 'Southwestern terracotta, sage, and rising sunburst focals',
    paletteColors: ['#B8AB90', '#706550', '#FFF8EF', '#FF97BD'],
    focalSummary: 'Saguaro Blossoms + Rising Suns',
    defaultHardware: 'rose-gold',
  },
  {
    id: 'neon-glow',
    name: 'Glow & Neon Retro Daisy',
    tagline: 'Electric starbursts, daisy smileys, and high-energy neon hues',
    paletteColors: ['#FFC107', '#FF689D', '#10B981', '#171416'],
    focalSummary: 'Daisy Smileys + Electric Stars',
    defaultHardware: 'silver',
  },
  {
    id: 'mermaid-cove',
    name: 'Pastel Princess & Mermaid Cove',
    tagline: 'Princess tiaras, fairy butterflies, and shimmery gold accents',
    paletteColors: ['#F8BCCB', '#FFC107', '#E7DECB', '#FFFFFF'],
    focalSummary: 'Tiara Crowns + Fairy Butterflies',
    defaultHardware: 'gold',
  },
];

export interface KitConfiguration {
  themeId: string;
  themeName: string;
  guestCount: number;
  totalFinishedProjects: number;
  hardware: 'silver' | 'rose-gold' | 'gold';
  includeLetters: boolean;
  basePriceCents: number;
  extraGuestsPriceCents: number;
  totalPriceCents: number;
}

export interface KitConfiguratorProps {
  initialThemeId?: string;
  initialGuestCount?: number;
  onAddToCart?: (config: KitConfiguration) => void;
  className?: string;
}

/**
 * Calculate dynamic pricing and supply invariants for 15+ guest kits.
 * Base 15 guests = $189.00 (18900 cents)
 * Each additional guest = $12.00 (1200 cents)
 */
export function calculateKitPricing(guestCount: number) {
  const baseGuests = 15;
  const basePriceCents = 18900;
  const pricePerExtraGuestCents = 1200;

  const validGuestCount = Math.max(baseGuests, Math.min(30, guestCount));
  const extraGuests = validGuestCount - baseGuests;
  const extraGuestsPriceCents = extraGuests * pricePerExtraGuestCents;
  const totalPriceCents = basePriceCents + extraGuestsPriceCents;
  const totalProjects = validGuestCount * 3;

  return {
    validGuestCount,
    extraGuests,
    basePriceCents,
    extraGuestsPriceCents,
    totalPriceCents,
    totalProjects,
    costPerGuestCents: Math.round(totalPriceCents / validGuestCount),
  };
}

export const KitConfigurator: React.FC<KitConfiguratorProps> = ({
  initialThemeId = 'taylor-era',
  initialGuestCount = 15,
  onAddToCart,
  className,
}) => {
  const [selectedThemeId, setSelectedThemeId] = React.useState<string>(initialThemeId);
  const [guestCount, setGuestCount] = React.useState<number>(initialGuestCount);
  const [selectedHardware, setSelectedHardware] = React.useState<'silver' | 'rose-gold' | 'gold'>(
    'silver'
  );
  const [includeLetters, setIncludeLetters] = React.useState<boolean>(true);
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);

  const selectedTheme =
    THEME_OPTIONS.find((t) => t.id === selectedThemeId) || THEME_OPTIONS[0];

  // Pricing & project calculation
  const pricing = calculateKitPricing(guestCount);

  // Sync default hardware when theme changes
  const handleThemeChange = (themeId: string) => {
    setSelectedThemeId(themeId);
    const theme = THEME_OPTIONS.find((t) => t.id === themeId);
    if (theme) {
      setSelectedHardware(theme.defaultHardware);
    }
  };

  const handleReserve = () => {
    const config: KitConfiguration = {
      themeId: selectedTheme.id,
      themeName: selectedTheme.name,
      guestCount: pricing.validGuestCount,
      totalFinishedProjects: pricing.totalProjects,
      hardware: selectedHardware,
      includeLetters,
      basePriceCents: pricing.basePriceCents,
      extraGuestsPriceCents: pricing.extraGuestsPriceCents,
      totalPriceCents: pricing.totalPriceCents,
    };

    if (onAddToCart) {
      onAddToCart(config);
    } else {
      setFeedbackMessage(
        `Added to Bag: ${pricing.validGuestCount}-Guest ${selectedTheme.name} Party Kit (${formatCurrency(pricing.totalPriceCents)})`
      );
    }
  };

  return (
    <div
      className={cn(
        'rounded-3xl border-2 border-cream-300 bg-white p-6 sm:p-10 shadow-lg w-full',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-cream-300">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="pink" size="sm">
              Customizer
            </Badge>
            <Badge variant="charcoal" size="sm">
              15-Guest Minimum Base
            </Badge>
          </div>
          <h2 className="font-accent font-bold text-2xl sm:text-3xl text-charcoal-950">
            Build Your 15-Guest Party Kit
          </h2>
          <p className="text-body-sm text-charcoal-700 mt-1">
            Complete supplies for 3 finished projects per guest. Guaranteed zero stress.
          </p>
        </div>

        {/* Live Price Tag */}
        <div className="bg-cream-100 border border-cream-300 rounded-2xl p-4 sm:px-6 text-right min-w-[220px]">
          <span className="text-xs uppercase font-bold text-charcoal-700 block">
            Kit Price (USD)
          </span>
          <span className="font-accent font-bold text-3xl text-charcoal-950 block">
            {formatCurrency(pricing.totalPriceCents)}
          </span>
          <span className="text-xs text-charcoal-700 block mt-0.5">
            {formatCurrency(pricing.costPerGuestCents)} / guest • {pricing.totalProjects} total projects
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customization Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* Step 1: Select Theme */}
          <div>
            <label className="text-body-sm font-bold text-charcoal-950 block mb-3">
              1. Choose Party Theme & Colorway
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Party Themes">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleThemeChange(theme.id)}
                    className={cn(
                      'flex flex-col text-left p-4 rounded-xl border-2 transition-all relative select-none',
                      'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-raspberry-500/30',
                      isSelected
                        ? 'border-raspberry-600 bg-pink-50/50 shadow-xs ring-1 ring-raspberry-600'
                        : 'border-cream-300 bg-white hover:border-charcoal-700 hover:bg-cream-100'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-accent font-bold text-sm text-charcoal-950">
                        {theme.name}
                      </span>
                      {/* Color Palette Swatches */}
                      <div className="flex items-center gap-1" aria-hidden="true">
                        {theme.paletteColors.map((color, idx) => (
                          <span
                            key={idx}
                            className="h-3.5 w-3.5 rounded-full border border-charcoal-950/20"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-charcoal-700 leading-snug">
                      {theme.tagline}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Guest Count Selector */}
          <div>
            <QuantitySelector
              id="kit-guest-counter"
              label="2. Select Party Guest Count"
              unitLabel="Guests"
              value={guestCount}
              onChange={setGuestCount}
              min={15}
              max={30}
              step={1}
              showHelperText={true}
            />
            {guestCount > 15 && (
              <p className="text-xs text-raspberry-700 font-semibold mt-1">
                +{(guestCount - 15)} additional guests added (+{formatCurrency(pricing.extraGuestsPriceCents)})
              </p>
            )}
          </div>

          {/* Step 3: Hardware Finish */}
          <div>
            <label className="text-body-sm font-bold text-charcoal-950 block mb-2">
              3. Hardware Metal Finish
            </label>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  { id: 'silver', label: 'Classic Silver' },
                  { id: 'rose-gold', label: 'Warm Rose Gold' },
                  { id: 'gold', label: 'Champagne Gold' },
                ] as const
              ).map((finish) => {
                const isSelected = selectedHardware === finish.id;
                return (
                  <button
                    key={finish.id}
                    type="button"
                    onClick={() => setSelectedHardware(finish.id)}
                    className={cn(
                      'min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold border-2 transition-all select-none',
                      'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-raspberry-500/30',
                      isSelected
                        ? 'border-charcoal-950 bg-charcoal-950 text-white shadow-xs'
                        : 'border-cream-300 bg-white text-charcoal-950 hover:bg-cream-100'
                    )}
                  >
                    {finish.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Personalization Toggle */}
          <div className="pt-4 border-t border-cream-300">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeLetters}
                onChange={(e) => setIncludeLetters(e.target.checked)}
                className="h-5 w-5 rounded border-cream-300 text-raspberry-600 focus:ring-raspberry-500 mt-0.5"
              />
              <div className="flex flex-col text-sm">
                <span className="font-semibold text-charcoal-950">
                  Include 60 pooled alphabet cube beads for personalized bracelets
                </span>
                <span className="text-xs text-charcoal-700">
                  Guests can spell their names, initials, or favorite songs. Included at zero extra charge!
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Right Column: Live Supply BOM & Confirmation Summary (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border-2 border-cream-300 bg-cream-100 p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cream-300 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-raspberry-700">
                Live Packout Preview
              </span>
              <Badge variant="charcoal" size="sm">
                {pricing.totalProjects} Keepsakes
              </Badge>
            </div>

            <h3 className="font-accent font-bold text-xl text-charcoal-950 mb-1">
              {selectedTheme.name}
            </h3>
            <p className="text-xs text-charcoal-700 mb-4">
              {selectedTheme.focalSummary} • {selectedHardware.toUpperCase()} hardware
            </p>

            {/* Detailed Component Allocation List */}
            <div className="space-y-2 text-xs text-charcoal-950 mb-6 bg-white p-4 rounded-xl border border-cream-300">
              <div className="flex justify-between py-1 border-b border-cream-200">
                <span>Beadable Metallic Ballpoint Pens:</span>
                <span className="font-bold">{pricing.validGuestCount} (+1 spare)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-cream-200">
                <span>Swivel Keyrings & Backpack Clasps:</span>
                <span className="font-bold">{pricing.validGuestCount} (+1 spare)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-cream-200">
                <span>Pre-cut 12" Elastic Stretch Cords:</span>
                <span className="font-bold">{pricing.validGuestCount} (+3 spares)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-cream-200">
                <span>Theme Silicone Focal Beads:</span>
                <span className="font-bold">{pricing.validGuestCount * 3} (+3 spares)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-cream-200">
                <span>Round Accent Beads (15mm & 12mm):</span>
                <span className="font-bold">{pricing.validGuestCount * 18} (+25 spares)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-cream-200">
                <span>Rhinestone Spacers (8mm):</span>
                <span className="font-bold">{pricing.validGuestCount * 2} (+5 spares)</span>
              </div>
              {includeLetters && (
                <div className="flex justify-between py-1 border-b border-cream-200 text-raspberry-700">
                  <span>Alphabet Letter Beads:</span>
                  <span className="font-bold">60 pooled</span>
                </div>
              )}
              <div className="flex justify-between py-1 text-charcoal-700">
                <span>Master Host Guide + 2 Sorting Trays:</span>
                <span className="font-bold">Included</span>
              </div>
            </div>
          </div>

          {/* Pricing Box & Reservation CTA */}
          <div className="pt-4 border-t border-cream-300 flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-charcoal-950">Total Package:</span>
              <span className="font-accent font-bold text-2xl text-charcoal-950">
                {formatCurrency(pricing.totalPriceCents)}
              </span>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleReserve}
              aria-label={`Reserve ${pricing.validGuestCount}-guest ${selectedTheme.name} kit for ${formatCurrency(pricing.totalPriceCents)}`}
            >
              Reserve Kit — {formatCurrency(pricing.totalPriceCents)}
            </Button>

            {feedbackMessage && (
              <div
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center"
                role="status"
              >
                {feedbackMessage}
              </div>
            )}

            <p className="text-[11px] text-center text-charcoal-600">
              Free nationwide delivery. Components atomically reserved upon checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

KitConfigurator.displayName = 'KitConfigurator';

export default KitConfigurator;
