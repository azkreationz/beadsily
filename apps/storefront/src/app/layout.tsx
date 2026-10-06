import * as React from 'react';
import './globals.css';
import { generateOrganizationSchema } from '../lib/seo';

export const metadata = {
  title: 'BeadsILY — Direct-to-Consumer Party Craft Kits & Curated Beads',
  description:
    'Thoughtfully curated bead craft party kits for 15+ guests, monthly subscriptions, and curated mystery boxes with guaranteed project counts. Free nationwide shipping on kits.',
  alternates: {
    canonical: 'https://beadsily.com',
  },
  openGraph: {
    title: 'BeadsILY — Direct-to-Consumer Party Craft Kits & Curated Beads',
    description:
      'Thoughtfully curated bead craft party kits for 15+ guests, monthly subscriptions, and curated mystery boxes with guaranteed project counts.',
    url: 'https://beadsily.com',
    siteName: 'BeadsILY',
    images: [
      {
        url: 'https://beadsily.com/brand/beadsily-logo.svg',
        width: 1200,
        height: 630,
        alt: 'BeadsILY Brand Identity',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BeadsILY — Direct-to-Consumer Party Craft Kits & Curated Beads',
    description:
      'Thoughtfully curated bead craft party kits for 15+ guests, monthly subscriptions, and curated mystery boxes with guaranteed project counts.',
    images: ['https://beadsily.com/brand/beadsily-logo.svg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = generateOrganizationSchema();

  return (
    <html lang="en" className="h-full bg-cream-100">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/brand/beadsily-heart-icon.svg" type="image/svg+xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-cream-100 text-charcoal-950 antialiased">
        {/* Festival Announcement Bar */}
        <div className="bg-charcoal-950 text-white text-xs font-semibold py-2 px-4 text-center">
          <p>
            Visiting the Santa Fe Elementary Fall Festival on Oct 23?{' '}
            <span className="text-pink-400 font-bold">Stop by our booth for exclusive charms!</span>
          </p>
        </div>

        {/* Global Storefront Header */}
        <header className="sticky top-0 z-40 w-full border-b border-cream-300 bg-cream-100/95 backdrop-blur-md">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <a href="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-raspberry-500 rounded-md">
                <img
                  src="/brand/beadsily-logo.svg"
                  alt="BeadsILY Logo"
                  className="h-10 sm:h-12 w-auto"
                />
              </a>

              {/* Tagline for desktop */}
              <span className="hidden lg:inline-block text-xs font-bold uppercase tracking-widest text-charcoal-700 pl-4 border-l border-cream-300">
                BRACELETS • KEYCHAINS • BEADABLES
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
              <a
                href="/party-kits"
                className="text-body-sm font-semibold text-charcoal-950 hover:text-raspberry-600 transition-colors"
              >
                15-Guest Party Kits
              </a>
              <a
                href="/mystery-boxes"
                className="text-body-sm font-semibold text-charcoal-950 hover:text-raspberry-600 transition-colors"
              >
                Curated Mystery Boxes
              </a>
              <a
                href="/monthly-box"
                className="text-body-sm font-semibold text-charcoal-950 hover:text-raspberry-600 transition-colors"
              >
                Monthly Subscription
              </a>
              <a
                href="/host-guide"
                className="text-body-sm font-semibold text-charcoal-950 hover:text-raspberry-600 transition-colors"
              >
                Host Guides
              </a>
            </nav>

            {/* Actions / Bag */}
            <div className="flex items-center gap-4">
              <a
                href="/party-kits"
                className="hidden sm:inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-full bg-pink-500 text-charcoal-950 font-bold text-sm shadow-sm hover:bg-pink-400 transition-all focus:outline-none focus:ring-4 focus:ring-raspberry-500/40"
              >
                Build 15-Guest Kit
              </a>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>

        {/* Global Storefront Footer */}
        <footer className="border-t border-cream-300 bg-charcoal-950 text-white pt-12 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <img
                src="/brand/beadsily-logo-white.svg"
                alt="BeadsILY White Logo"
                className="h-9 w-auto mb-4"
              />
              <p className="text-sm text-cream-300 leading-relaxed mb-4">
                Curated bead craft experiences for party hosts, celebratory gatherings, and creative makers.
              </p>
              <p className="text-xs text-cream-400">
                Official Supplier for Santa Fe Elementary School Festival 2026.
              </p>
            </div>

            <div>
              <h4 className="font-accent font-bold text-sm uppercase tracking-wider text-pink-400 mb-3">
                Craft Experiences
              </h4>
              <ul className="space-y-2 text-sm text-cream-200">
                <li><a href="/party-kits" className="hover:text-white transition-colors">15-Guest Party Kits (45 Projects)</a></li>
                <li><a href="/mystery-boxes" className="hover:text-white transition-colors">Curated Mystery Boxes</a></li>
                <li><a href="/monthly-box" className="hover:text-white transition-colors">Monthly Craft Subscription</a></li>
                <li><a href="/finished-accessories" className="hover:text-white transition-colors">Finished Accessories</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-accent font-bold text-sm uppercase tracking-wider text-pink-400 mb-3">
                Host Resources
              </h4>
              <ul className="space-y-2 text-sm text-cream-200">
                <li><a href="/host-guide" className="hover:text-white transition-colors">Host Master Guide</a></li>
                <li><a href="/guest-cards" className="hover:text-white transition-colors">Printable Guest Cards</a></li>
                <li><a href="/safety" className="hover:text-white transition-colors">Age & Supervision Guidance</a></li>
                <li><a href="/faq" className="hover:text-white transition-colors">Frequently Asked Questions</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-accent font-bold text-sm uppercase tracking-wider text-pink-400 mb-3">
                Customer Care
              </h4>
              <ul className="space-y-2 text-sm text-cream-200">
                <li><a href="/contact" className="hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="/shipping-returns" className="hover:text-white transition-colors">Shipping & Returns</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="mx-auto max-w-7xl pt-8 border-t border-charcoal-800 flex flex-col sm:flex-row items-center justify-between text-xs text-cream-400 gap-4">
            <p>© 2026 BeadsILY. All rights reserved. Tactile craft party kits & curated keepsakes.</p>
            <p>Designed with love for crafters of all ages.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
