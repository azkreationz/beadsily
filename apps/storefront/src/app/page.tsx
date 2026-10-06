import * as React from 'react';
import {
  HeroBanner,
  ProductCard,
  QuantitySelector,
  Accordion,
  Button,
  Badge,
} from '@beadsily/ui';

export default function HomePage() {
  // Configurator state: base 15 guests
  const [guestCount, setGuestCount] = React.useState<number>(15);

  // Price computation: $189 base for 15 guests, $12 per additional guest
  const basePriceCents = 18900;
  const pricePerExtraGuestCents = 1200;
  const totalPriceCents =
    basePriceCents + Math.max(0, guestCount - 15) * pricePerExtraGuestCents;

  const totalFinishedProjects = guestCount * 3;

  const faqItems = [
    {
      id: 'how-it-works',
      title: 'How does a 15-Guest Party Kit work?',
      subtitle: 'Everything included for 45 finished keepsakes',
      content: (
        <p>
          Every BeadsILY Party Kit starts with a complete foundation for 15 guests. Each guest
          creates exactly <strong>three finished keepsakes</strong>: one premium beadable pen, one
          adjustable stretch bracelet, and one durable keychain or backpack charm. That’s{' '}
          <strong>45 total finished crafts</strong> in one box, with pre-sorted guest trays, shared
          pliers, and step-by-step color instruction cards.
        </p>
      ),
      defaultOpen: true,
    },
    {
      id: 'mystery-guarantee',
      title: 'What makes BeadsILY Mystery Boxes different?',
      subtitle: 'Disclosed project counts, sealed inventory, zero lottery mechanics',
      content: (
        <p>
          Unlike online mystery games or virtual lottery wheels, BeadsILY mystery craft boxes are{' '}
          <strong>physical, prepacked sealed inventory units</strong> with guaranteed project counts.
          Our Mystery Maker box guarantees 3 complete craft projects (1 pen, 1 bracelet, 1 keychain),
          while the colorways, charms, and silicone focals are the joyful surprise element!
        </p>
      ),
    },
    {
      id: 'host-guidance',
      title: 'Do I need craft experience to host?',
      subtitle: 'Designed for stress-free novice hosting',
      content: (
        <p>
          None at all! Our Master Host Guide (tested under usability protocol KIT-01) provides
          a minute-by-minute timeline, party seating tips, and emergency bead-spill prevention mats.
          Novice parent testers successfully guided a full 15-guest group in under 90 minutes.
        </p>
      ),
    },
    {
      id: 'booth-festival',
      title: 'Will you be at the Santa Fe Elementary Fall Festival?',
      subtitle: 'Friday October 23, 2026, 5–8 p.m.',
      content: (
        <p>
          Yes! Stop by the BeadsILY canopy booth at the Santa Fe Elementary School festival. We’ll
          have finished charms, mystery boxes, and live beadable pen assembly on site.
        </p>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-12 sm:gap-16 pb-20">
      {/* 1. Hero Banner Component */}
      <HeroBanner
        theme="cream"
        announcement="Santa Fe Elementary Fall Festival Booth • October 23, 2026"
        tagline="BRACELETS • KEYCHAINS • BEADABLES"
        title={
          <span>
            Unforgettable Bead Parties,{' '}
            <span className="text-pink-500 underline decoration-raspberry-500 decoration-wavy">
              Stress-Free
            </span>
          </span>
        }
        subtitle="Complete 15-guest craft party kits with 45 finished keepsakes, pre-sorted guest supplies, and step-by-step guides. Shipped nationwide."
        primaryCta={{
          label: 'Customize 15-Guest Kit — From $189',
          href: '#configurator',
        }}
        secondaryCta={{
          label: 'Shop Curated Mystery Boxes',
          href: '#catalog',
        }}
        features={[
          {
            title: '45 Finished Keepsakes',
            desc: 'Every guest crafts 1 pen, 1 bracelet, and 1 keychain to take home.',
          },
          {
            title: 'Zero-Prep Host Trays',
            desc: 'Individual guest supply bags plus shared tools and bead mats included.',
          },
          {
            title: 'Free Fast Shipping',
            desc: 'Guaranteed delivery with replacement component buffer in every master box.',
          },
        ]}
      />

      {/* 2. Interactive 15-Guest Kit Configurator Section */}
      <section
        id="configurator"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-24 w-full"
      >
        <div className="rounded-3xl border-2 border-cream-300 bg-white p-6 sm:p-10 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-cream-300">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="pink" size="sm">
                  Interactive Configurator
                </Badge>
                <Badge variant="charcoal" size="sm">
                  15-Guest Base
                </Badge>
              </div>
              <h2 className="font-accent font-bold text-2xl sm:text-3xl text-charcoal-950">
                Configure Your Party Kit
              </h2>
              <p className="text-body-sm text-charcoal-700 mt-1">
                Calculate supplies, guest projects, and real pricing with zero guesswork.
              </p>
            </div>

            {/* Price Preview Card */}
            <div className="bg-cream-100 border border-cream-300 rounded-2xl p-4 sm:px-6 text-right min-w-[200px]">
              <span className="text-xs uppercase font-bold text-charcoal-700 block">
                Total Price (USD)
              </span>
              <span className="font-accent font-bold text-3xl text-charcoal-950">
                ${(totalPriceCents / 100).toFixed(2)}
              </span>
              <span className="text-xs text-charcoal-700 block mt-0.5">
                (${(totalPriceCents / 100 / guestCount).toFixed(2)} per guest)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Quantity Controls */}
            <div className="flex flex-col gap-6">
              <QuantitySelector
                id="party-guest-count"
                label="Party Guest Count"
                unitLabel="Guests"
                value={guestCount}
                onChange={setGuestCount}
                min={15}
                max={50}
                step={1}
                showHelperText={true}
              />

              <div className="p-4 rounded-xl bg-cream-100 border border-cream-300 text-sm">
                <h4 className="font-semibold text-charcoal-950 mb-1">
                  What’s in your {guestCount}-Guest Master Shipper:
                </h4>
                <ul className="space-y-1 text-charcoal-700 text-xs sm:text-sm">
                  <li>• <strong>{guestCount}</strong> Beadable Metallic Ballpoint Pens + ink refills</li>
                  <li>• <strong>{guestCount}</strong> Heavy-duty Carabiner Keychains & charms</li>
                  <li>• <strong>{guestCount}</strong> Elastic Stretch Cords & pre-measured silicone beads</li>
                  <li>• <strong>{totalFinishedProjects}</strong> Total finished projects for guests to keep</li>
                  <li>• Master Host Instruction Folio + 2 bead safety mats</li>
                </ul>
              </div>
            </div>

            {/* Visual Summary Card */}
            <div className="rounded-2xl border-2 border-dashed border-raspberry-300 bg-pink-50/50 p-6 flex flex-col justify-between h-full">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-raspberry-700 block mb-2">
                  Live Party Calculation
                </span>
                <h3 className="font-display text-2xl font-bold text-charcoal-950 mb-3">
                  {guestCount} Guests • {totalFinishedProjects} Projects
                </h3>
                <p className="text-sm text-charcoal-700 mb-4 leading-relaxed">
                  Every attendee leaves with 3 handmade keepsakes. Real-time component reservation
                  ensures all beads, rods, and cords are reserved atomically in inventory.
                </p>
              </div>

              <div className="pt-4 border-t border-raspberry-200 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => alert(`Reserved ${guestCount}-guest kit quote: $${(totalPriceCents/100).toFixed(2)}`)}
                >
                  Reserve {guestCount}-Guest Kit — ${(totalPriceCents / 100).toFixed(2)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Launch Catalog Grid Section */}
      <section id="catalog" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="amber" size="sm" className="mb-2">
            Curated Launch Catalog
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-charcoal-950 mb-3">
            Handcrafted Kit Collections
          </h2>
          <p className="text-body-md text-charcoal-700">
            Validated kit recipes with honest component accounting, guaranteed supplies, and no phantom variants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1: 15-Guest Kit */}
          <ProductCard
            id="kit-01"
            slug="ultimate-15-guest-party-kit"
            title="The Ultimate 15-Guest Party Kit"
            description="Our flagship party experience: 45 finished keepsakes, 15 pre-sorted guest supply bags, and full host guidance."
            priceInCents={18900}
            category="party-kit"
            guestCount={15}
            projectsPerGuest={3}
            totalFinishedProjects={45}
            badge={{ label: 'Most Popular', variant: 'pink' }}
            guaranteedItemsSummary={[
              '15 Beadable Pens + 15 refills',
              '15 Backpack Keychains',
              '15 Beadable Bracelets',
              'Master Host Folio & bead mats',
            ]}
            stockStatus="in_stock"
          />

          {/* Card 2: Mystery Maker Single */}
          <ProductCard
            id="box-mystery-maker"
            slug="mystery-maker-box"
            title="Mystery Maker Single Craft Box"
            description="Curated single-maker craft box with surprise color palette and theme focals. Guaranteed 3 complete projects."
            priceInCents={2800}
            category="mystery-box"
            guaranteedProjectsCount={3}
            badge={{ label: 'Curated Mystery', variant: 'amber' }}
            guaranteedItemsSummary={[
              '1 Beadable Pen',
              '1 Beadable Bracelet',
              '1 Backpack Keychain',
              'Prepacked sealed unit',
            ]}
            stockStatus="prepacked_sealed"
          />

          {/* Card 3: Bestie Mystery Duo */}
          <ProductCard
            id="box-bestie-duo"
            slug="bestie-mystery-duo"
            title="Bestie Mystery Duo (2 Sets)"
            description="Two complete coordinated craft sets for best friends, siblings, or parent-child crafting sessions."
            priceInCents={4800}
            category="mystery-box"
            guaranteedProjectsCount={6}
            badge={{ label: 'Duo Pack', variant: 'charcoal' }}
            guaranteedItemsSummary={[
              '2 Beadable Pens',
              '2 Beadable Bracelets',
              '2 Backpack Keychains',
              'Complementary or matching focals',
            ]}
            stockStatus="prepacked_sealed"
          />
        </div>
      </section>

      {/* 4. FAQ & Guidance Accordion Section */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-8">
          <Badge variant="raspberry" size="sm" className="mb-2">
            Host Guidance & FAQs
          </Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-charcoal-950 mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-body-sm text-charcoal-700">
            Clear facts on kit contents, mystery box guarantees, and school booth details.
          </p>
        </div>

        <Accordion items={faqItems} allowMultiple={false} />
      </section>

      {/* 5. School Booth Callout Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-3xl bg-charcoal-950 text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-pink-400 block mb-2">
              School Festival Exclusive
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Santa Fe Elementary Fall Festival
            </h2>
            <p className="text-cream-200 text-body-md mb-6 leading-relaxed">
              Visit our booth on Friday, October 23, 2026 (5–8 p.m.) for in-person beadable pen
              crafting, teacher appreciation charms, and school spirit colors!
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" size="lg">
                View Festival Booth Details
              </Button>
              <Button variant="secondary" size="lg">
                Host An Adult Party
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
