import * as React from 'react';
import {
  Badge,
  ProductCard,
  Accordion,
} from '@beadsily/ui';
import { KitConfigurator } from '../../components/KitConfigurator';

export const metadata = {
  title: '15-Guest Party Kits — BeadsILY Direct-to-Consumer',
  description:
    'Complete craft party kits for 15+ guests. Each attendee crafts 3 finished keepsakes (pen, bracelet, keychain) for 45 total projects. Free nationwide shipping.',
};

export default function PartyKitsPage() {
  const kitItems = [
    {
      id: 'PK-15-TAY',
      slug: 'taylors-era-friendship-kit',
      title: "Taylor's Era Friendship Bead Bar Kit",
      description:
        'Concert-ready friendship bead bar with heart sunglasses, glitter disco spheres, pastel pink/lilac beads, and pooled alphabet letters.',
      priceInCents: 18900,
      guestCount: 15,
      totalFinishedProjects: 45,
      badge: { label: 'Concert & Teen Favorite', variant: 'pink' as const },
      guaranteedItemsSummary: [
        '16 Beadable Pens + refills',
        '16 Swivel Backpack Clasps',
        '18 Stretch Cords (18 ft)',
        '48 Theme Silicone Focals (Heart & Disco)',
        '265 Silicone Accent Beads',
        '60 Pooled Alphabet Letters',
        'Master Host Guide + 2 sorting trays',
      ],
      stockStatus: 'in_stock' as const,
    },
    {
      id: 'PK-15-BOHO',
      slug: 'desert-bloom-boho-kit',
      title: 'Desert Bloom & Boho Party Kit',
      description:
        'Southwestern terracotta, sage, and rising sunburst focals. Perfect for adult celebrations, baby showers, and teen gatherings.',
      priceInCents: 18900,
      guestCount: 15,
      totalFinishedProjects: 45,
      badge: { label: 'Adult & Shower Hit', variant: 'amber' as const },
      guaranteedItemsSummary: [
        '16 Rose Gold Beadable Pens',
        '16 Rose Gold Swivel Clasps',
        '48 Theme Focals (Sunburst & Saguaro)',
        '265 Terracotta, Sage & White Accents',
        '60 Pastel Alphabet Letters',
        'Master Host Guide + 2 sorting trays',
      ],
      stockStatus: 'in_stock' as const,
    },
    {
      id: 'PK-15-NEON',
      slug: 'glow-neon-retro-daisy-kit',
      title: 'Glow & Neon Retro Daisy Party Kit',
      description:
        'Electric starbursts, daisy smileys, and high-energy neon tones. Created for roller rink parties, 90s/Y2K birthdays, and active tweens.',
      priceInCents: 18900,
      guestCount: 15,
      totalFinishedProjects: 45,
      badge: { label: '90s / Y2K Theme', variant: 'charcoal' as const },
      guaranteedItemsSummary: [
        '16 Silver Beadable Pens',
        '16 Silver Swivel Clasps',
        '48 Theme Focals (Daisy & Starburst)',
        '265 Electric Yellow & Hot Pink Accents',
        '60 Alphabet Letters',
        'Master Host Guide + 2 sorting trays',
      ],
      stockStatus: 'in_stock' as const,
    },
    {
      id: 'PK-15-PRN',
      slug: 'pastel-princess-fairytale-kit',
      title: 'Pastel Princess & Fairytale Kit',
      description:
        'Tiara crowns, fairy butterflies, and shimmery gold accents. Designed for ages 6+ birthdays and tea party celebrations.',
      priceInCents: 18900,
      guestCount: 15,
      totalFinishedProjects: 45,
      badge: { label: 'Ages 6+ Princess', variant: 'pink' as const },
      guaranteedItemsSummary: [
        '16 Champagne Gold Beadable Pens',
        '16 Gold Swivel Clasps',
        '48 Theme Focals (Crowns & Butterflies)',
        '265 Lilac, Pink & Glitter Gold Accents',
        '60 Alphabet Letters',
        'Master Host Guide + 2 sorting trays',
      ],
      stockStatus: 'in_stock' as const,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col gap-14">
      {/* Intro Header */}
      <div className="max-w-3xl">
        <Badge variant="pink" size="sm" className="mb-2">
          Nationwide Party Kits
        </Badge>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-charcoal-950 mb-4">
          15-Guest Craft Party Experiences
        </h1>
        <p className="text-body-md sm:text-body-lg text-charcoal-700 leading-relaxed">
          Every guest makes 3 complete, functional accessories: one beadable pen, one backpack
          keychain charm, and one stretch bracelet. That’s 45 finished craft keepsakes in every box,
          with pre-sorted supplies and stress-free hosting instructions.
        </p>
      </div>

      {/* Interactive Configurator */}
      <section id="configurator">
        <KitConfigurator />
      </section>

      {/* Catalog of Themes */}
      <section className="pt-8">
        <div className="mb-8">
          <h2 className="font-accent font-bold text-2xl sm:text-3xl text-charcoal-950 mb-2">
            Explore All 4 Launch Themes
          </h2>
          <p className="text-body-sm text-charcoal-700">
            Backed by physically verified component inventories in stock.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {kitItems.map((kit) => (
            <ProductCard
              key={kit.id}
              id={kit.id}
              slug={kit.slug}
              title={kit.title}
              description={kit.description}
              priceInCents={kit.priceInCents}
              guestCount={kit.guestCount}
              projectsPerGuest={3}
              totalFinishedProjects={kit.totalFinishedProjects}
              badge={kit.badge}
              guaranteedItemsSummary={kit.guaranteedItemsSummary}
              stockStatus={kit.stockStatus}
              ctaLabel="Customize This Kit"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
