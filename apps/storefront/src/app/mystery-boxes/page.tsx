import * as React from 'react';
import {
  Badge,
  ProductCard,
  Accordion,
} from '@beadsily/ui';

export const metadata = {
  title: 'Curated Mystery Craft Boxes — BeadsILY Direct-to-Consumer',
  description:
    'Thoughtfully curated physical mystery bead boxes with guaranteed project counts. 100% complete supplies, prepacked sealed inventory, zero recurring subscription traps.',
};

export default function MysteryBoxesPage() {
  const mysteryProducts = [
    {
      id: 'MYS-MKR-01',
      slug: 'mystery-maker-solo',
      title: 'Mystery Maker Solo Craft Box',
      description:
        'A single crafter mystery box featuring surprise coordinated silicone focals, round accents, and metallic finishes. Complete supplies for 3 functional projects.',
      priceInCents: 2800,
      category: 'mystery-box' as const,
      guaranteedProjectsCount: 3,
      badge: { label: 'Single Crafter', variant: 'pink' as const },
      guaranteedItemsSummary: [
        '1 Beadable Metallic Pen + ink refill',
        '1 Swivel Keyring Backpack Clasp',
        '1 Pre-cut 12" Elastic Stretch Bracelet Cord',
        '3 Surprise Silicone Focal Beads',
        '20 Round Silicone Accent Beads & Rhinestones',
        '1 Compact 3-Project Instruction Guide',
        '1 Tamper-Evident Sealed Kraft Mailer',
      ],
      stockStatus: 'prepacked_sealed' as const,
    },
    {
      id: 'MYS-DUO-01',
      slug: 'bestie-mystery-duo',
      title: 'Bestie Mystery Duo Craft Box',
      description:
        'Craft together! Two complete matching or complementary sets of 3 projects. Ideal for best friends, siblings, or parent-child crafting time.',
      priceInCents: 4800,
      category: 'mystery-box' as const,
      guaranteedProjectsCount: 6,
      badge: { label: 'Two Crafters', variant: 'charcoal' as const },
      guaranteedItemsSummary: [
        '2 Beadable Metallic Pens + refills',
        '2 Swivel Keyring Backpack Clasps',
        '2 Pre-cut Elastic Stretch Bracelet Cords',
        '6 Coordinated Surprise Silicone Focals (2 sets)',
        '40 Round Silicone Accent Beads & Rhinestones',
        '2 Organza Gift Pouches',
        'Prepacked sealed unit with tamper-evident seal',
      ],
      stockStatus: 'prepacked_sealed' as const,
    },
  ];

  const mysteryFaqs = [
    {
      id: 'what-is-guaranteed',
      title: 'What is guaranteed in every mystery box?',
      subtitle: 'Exact project counts and complete hardware',
      content: (
        <p>
          Every mystery box discloses its exact project count upfront. The Mystery Maker guarantees
          enough materials to assemble <strong>1 pen, 1 bracelet, and 1 keychain</strong>. You will
          never open a box missing rods, cords, or clasps.
        </p>
      ),
      defaultOpen: true,
    },
    {
      id: 'what-is-the-surprise',
      title: 'What is the surprise element?',
      subtitle: 'Color harmony, theme focals, and bead styling',
      content: (
        <p>
          The surprise lies in the <strong>creative styling and focal characters</strong>: you might
          unbox retro daisies, celestial sunbursts, glitter disco balls, cute animals, or pastel
          holiday motifs!
        </p>
      ),
    },
    {
      id: 'no-recurring-charges',
      title: 'Will purchasing a mystery box enroll me in a subscription?',
      subtitle: '100% one-time physical purchase guarantee',
      content: (
        <p>
          <strong>No, never.</strong> BeadsILY mystery boxes are strictly one-time product purchases.
          Buying a mystery box will never automatically enroll your payment method in recurring
          monthly billing.
        </p>
      ),
    },
    {
      id: 'sealed-inventory',
      title: 'How is mystery inventory managed?',
      subtitle: 'Assembled and sealed before sale',
      content: (
        <p>
          Our operations team physically prepacks each box with a tamper-evident holographic seal.
          When you check out, the specific sealed box is locked to your order. There are no virtual
          lottery wheels, roulette spinners, or phantom variant pools.
        </p>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col gap-14">
      {/* Intro Header */}
      <div className="max-w-3xl">
        <Badge variant="amber" size="sm" className="mb-2">
          Curated Craft Assortment
        </Badge>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-charcoal-950 mb-4">
          Curated Mystery Craft Boxes
        </h1>
        <p className="text-body-md sm:text-body-lg text-charcoal-700 leading-relaxed">
          The joy of unboxing a surprise, backed by the certainty of guaranteed project counts.
          Every sealed box includes 100% complete supplies for pens, keychains, and bracelets.
        </p>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {mysteryProducts.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            slug={product.slug}
            title={product.title}
            description={product.description}
            priceInCents={product.priceInCents}
            category={product.category}
            guaranteedProjectsCount={product.guaranteedProjectsCount}
            badge={product.badge}
            guaranteedItemsSummary={product.guaranteedItemsSummary}
            stockStatus={product.stockStatus}
            ctaLabel="Select Mystery Box"
          />
        ))}
      </div>

      {/* Mystery Invariants Accordion */}
      <section className="pt-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <Badge variant="raspberry" size="sm" className="mb-2">
            The BeadsILY Promise
          </Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-charcoal-950 mb-2">
            Mystery Box Guarantees & Transparency
          </h2>
          <p className="text-body-sm text-charcoal-700">
            Honest physical commerce: surprise curation without lottery mechanics.
          </p>
        </div>

        <Accordion items={mysteryFaqs} allowMultiple={false} />
      </section>
    </div>
  );
}
