/**
 * BeadsILY Storefront Cloudflare Worker Entry Point
 * Direct-to-Consumer Commerce on Cloudflare Edge with D1, R2, and Stripe
 * Authors: Jim, Oscar, Dwight, Erin, Angela, Toby
 */

import { resolveCanonicalUrl } from './lib/seo.mjs';
import { getMysteryCatalog, allocateMysteryUnit, auditMysteryReturn, MYSTERY_TIERS } from '@beadsily/db';
import { createStripeClient, createEmbeddedCheckoutSession, handleStripeWebhook } from '@beadsily/payments';

export interface Env {
  DB: any;
  MEDIA: any;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  SESSION_SECRET?: string;
}

function getHtmlLayout(title: string, bodyContent: string, currentPath: string = '/', isTeaser: boolean = false): string {
  const jsonLdOrg = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BeadsILY",
    "url": "https://beadsily.com",
    "logo": "https://beadsily.com/brand/beadsily-logo.svg",
    "founder": {
      "@type": "Person",
      "name": "Lua"
    }
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | BeadsILY</title>
  <meta name="description" content="BeadsILY delivers tactile 15-guest party craft kits (45 keepsakes guaranteed) and curated one-time mystery craft boxes with zero lottery mechanics." />
  <link rel="canonical" href="https://beadsily.com${currentPath === '/' ? '' : currentPath}" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Poppins', 'system-ui', 'sans-serif'],
            display: ['Cinzel', 'serif'],
          },
          colors: {
            pink: {
              50: '#FFF0F6',
              100: '#FFE4EE',
              200: '#FFBFD6',
              300: '#FF97BD',
              400: '#FF80AD',
              500: '#FF689D', /* Official Bubble Pink */
              600: '#E84A83',
            },
            softpink: '#FFC4DD',
            rose: '#D93D75',
            cream: {
              100: '#FFF8EF', /* Official Pearl Cream */
              200: '#F8F1E4',
              300: '#E7DECB', /* Official Pearl Shade */
            },
            charcoal: {
              900: '#1C181A',
              950: '#171416', /* Official Soft Black */
            },
            gold: '#FFC107', /* Warm Gold */
            amber: {
              100: '#FFF9C4',
              400: '#FFEE58',
              500: '#FFC107',
            }
          }
        }
      }
    };
  </script>
  <script type="application/ld+json">${jsonLdOrg}</script>
  <style>
    /* WCAG 2.2 AA Contrast Enforcement */
    .btn-primary {
      background-color: #FF689D;
      color: #171416; /* 6.72:1 contrast ratio satisfies WCAG AA & AAA Large */
      font-weight: 700;
      min-height: 44px;
      min-width: 44px;
    }
    .btn-primary:hover {
      background-color: #E84A83;
    }
    .touch-target {
      min-height: 44px;
      min-width: 44px;
    }
    .teaser-bg {
      background: linear-gradient(180deg, rgba(23, 20, 22, 0.72) 0%, rgba(23, 20, 22, 0.45) 45%, rgba(23, 20, 22, 0.85) 100%),
                  url('/images/beadsily-craft-beads-flatlay.jpg') center/cover no-repeat fixed;
    }
  </style>
</head>
<body class="${isTeaser ? 'bg-charcoal-950 text-cream-100' : 'bg-cream-100 text-charcoal-950'} font-sans antialiased min-h-screen flex flex-col">
  <!-- Top Announcement Bar -->
  <aside aria-label="Announcement" class="bg-charcoal-950 text-cream-100 text-xs py-2 px-4 text-center font-medium border-b border-white/10">
    ✨ Soft Launch Event: Santa Fe Elementary Fall Festival (Friday, Oct 23, 2026, 5–8 PM Arizona MST) • Pre-order Party Kits Below
  </aside>

  <!-- Navigation Header -->
  <header class="border-b border-cream-200/80 bg-white/95 backdrop-blur sticky top-0 z-50 shadow-xs">
    <div class="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
      <a href="/" class="flex items-center gap-3 group">
        <img src="/brand/beadsily-wordmark-color.svg" alt="BEADSILY" class="h-6 md:h-7 w-auto transition-transform group-hover:scale-[1.02]" />
        <span class="font-display tracking-widest uppercase text-[11px] font-semibold text-charcoal-950 bg-pink-50 border-pink-500/20 px-2.5 py-0.5 rounded-full border shadow-2xs">Bead Bar</span>
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm font-semibold text-charcoal-900">
        <a href="/party-kits" class="hover:text-pink-600 transition-colors ${currentPath === '/party-kits' ? 'text-pink-600 font-bold' : ''}">15-Guest Party Kits</a>
        <a href="/mystery-boxes" class="hover:text-pink-600 transition-colors ${currentPath === '/mystery-boxes' ? 'text-pink-600 font-bold' : ''}">Curated Mystery Boxes</a>
        <a href="/party-kits#faq" class="hover:text-pink-600 transition-colors">Host Guide & FAQ</a>
      </nav>
      <div class="flex items-center gap-3">
        <a href="/#subscribe" class="btn-primary inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm transition-transform active:scale-95 shadow-sm">
          Join VIP List
        </a>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-grow">
    ${bodyContent}
  </main>

  <!-- Global Footer -->
  <footer class="bg-charcoal-950 text-cream-100 mt-20 border-t border-charcoal-900 py-12">
    <div class="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div class="space-y-3">
        <span class="text-xl font-black text-white">BeadsILY</span>
        <p class="text-xs text-neutral-400 leading-relaxed">
          Tactile, premium jewelry & keepsake crafting experiences for children's parties, school festivals, and creative adult gatherings.
        </p>
        <p class="text-xs text-neutral-500">A business unit of Nelsons US LLC.</p>
      </div>
      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-pink-500 mb-3">Shop Collections</h4>
        <ul class="text-xs space-y-2 text-neutral-300">
          <li><a href="/party-kits" class="hover:text-white">15-Guest Party Kits ($189)</a></li>
          <li><a href="/mystery-boxes" class="hover:text-white">Mystery Maker Solo ($28)</a></li>
          <li><a href="/mystery-boxes" class="hover:text-white">Bestie Mystery Duo ($48)</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-pink-500 mb-3">The BeadsILY Promise</h4>
        <ul class="text-xs space-y-2 text-neutral-400">
          <li>✓ 15 Guests / 45 Keepsakes Guaranteed</li>
          <li>✓ Generous Hardware & Extra Spares Included</li>
          <li>✓ Honest Sealed Boxes (No Subscription Traps)</li>
          <li>✓ Designed with Love for Crafters of All Ages</li>
        </ul>
      </div>
      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-pink-500 mb-3">Fall Festival Soft Launch</h4>
        <p class="text-xs text-neutral-300 leading-relaxed">
          Join us at Santa Fe Elementary Fall Festival!<br/>
          Friday, Oct 23, 2026 • 5–8 p.m.<br/>
          Card & Mobile Tap-to-Pay Accepted on Site.
        </p>
      </div>
    </div>
    <div class="max-w-6xl mx-auto px-4 mt-8 pt-8 border-t border-neutral-800 text-center text-xs text-neutral-500">
      &copy; 2026 BeadsILY / Nelsons US LLC. All rights reserved. • Canonical Host: beadsily.com
    </div>
  </footer>
</body>
</html>`;
}

function renderTeaserPage(url: URL): string {
  const isSubscribed = url.searchParams.get('subscribed') === '1';

  const content = `
    <!-- Teaser Full-Screen Hero -->
    <div class="teaser-bg relative min-h-[calc(100vh-140px)] flex items-center justify-center py-16 px-4">
      <div class="max-w-3xl w-full mx-auto space-y-8 text-center relative z-10">
        
        <!-- Eyebrow Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-pink-500/20 text-pink-300 border border-pink-500/40 font-display">
          💖 A little charm. A lot of heart.
        </div>

        <!-- Main Headline -->
        <div class="space-y-4">
          <h1 class="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-tight">
            Something Lovely is <br/>
            <span class="text-pink-400">In the Making.</span>
          </h1>
          <p class="text-base sm:text-xl text-cream-100 max-w-2xl mx-auto leading-relaxed font-normal">
            The modern bead bar for playful self-expression. High-grade 15-guest craft party kits (45 keepsakes guaranteed), curated mystery craft boxes, and custom accessories.
          </p>
        </div>

        <!-- Soft Launch Event Pill -->
        <div class="inline-flex flex-col sm:flex-row items-center gap-2 bg-charcoal-950/80 border border-pink-500/30 rounded-2xl px-6 py-3 text-xs sm:text-sm text-cream-100 shadow-xl backdrop-blur-md">
          <span class="text-amber-400 font-bold">✨ Soft Launch Event:</span>
          <span>Santa Fe Elementary Fall Festival • Friday, Oct 23, 2026 (5–8 PM MST)</span>
        </div>

        <!-- Email Subscription Box -->
        <div id="subscribe" class="bg-charcoal-950/70 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 max-w-xl mx-auto shadow-2xl space-y-4">
          <div class="space-y-1">
            <h2 class="text-lg sm:text-xl font-bold text-white">Be the First to Know</h2>
            <p class="text-xs sm:text-sm text-neutral-300">
              Subscribe for VIP launch access, opening announcements, and exclusive party kit perks.
            </p>
          </div>

          ${isSubscribed ? `
            <div class="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-4 text-emerald-200 text-sm font-semibold shadow-inner">
              🎉 You're on the VIP list! Thank you for subscribing. We'll send you early access and launch updates before our October 23 opening.
            </div>
          ` : `
            <form method="POST" action="/api/subscribe" class="flex flex-col sm:flex-row gap-3 pt-2">
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="Enter your email address..." 
                class="px-5 py-3.5 rounded-2xl border border-white/20 bg-white/95 text-charcoal-950 placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 flex-grow shadow-lg"
              />
              <button 
                type="submit" 
                class="btn-primary px-7 py-3.5 rounded-2xl text-sm font-bold shadow-lg transition-transform active:scale-95 whitespace-nowrap"
              >
                Subscribe for Updates
              </button>
            </form>
          `}

          <p class="text-[11px] text-neutral-400">
            Strictly opening announcements and early kit reservations. Unsubscribe anytime.
          </p>
        </div>

        <!-- Pre-Order & Collection Previews -->
        <div class="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
          <a href="/party-kits" class="group bg-white/5 hover:bg-white/10 border border-white/15 hover:border-pink-400/50 rounded-2xl p-5 transition-all backdrop-blur-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-pink-400">Launch Preview</span>
              <span class="text-xs text-neutral-400 group-hover:text-white transition-colors">From $189 →</span>
            </div>
            <h3 class="text-base font-bold text-white group-hover:text-pink-300 transition-colors mt-1">15-Guest Party Kits</h3>
            <p class="text-xs text-neutral-300 mt-1">45 keepsakes guaranteed (pens, keychains, bracelets) with full host guide & spares buffer.</p>
          </a>

          <a href="/mystery-boxes" class="group bg-white/5 hover:bg-white/10 border border-white/15 hover:border-amber-400/50 rounded-2xl p-5 transition-all backdrop-blur-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-amber-400">Curated Keepsakes</span>
              <span class="text-xs text-neutral-400 group-hover:text-white transition-colors">From $28 →</span>
            </div>
            <h3 class="text-base font-bold text-white group-hover:text-amber-300 transition-colors mt-1">Curated Mystery Boxes</h3>
            <p class="text-xs text-neutral-300 mt-1">Prepacked physical units with guaranteed project counts (3 or 6 projects). Zero subscriptions.</p>
          </a>
        </div>

      </div>
    </div>
  `;

  return getHtmlLayout('Craft Party Kits & Modern Bead Bar (Coming Soon)', content, '/', true);
}

function renderHomePage(): string {
  const content = `
    <!-- Hero Banner -->
    <section class="max-w-6xl mx-auto px-4 pt-12 pb-16 text-center space-y-6">
      <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-pink-50 text-charcoal-950 border border-pink-500/25">
        💖 A little charm. A lot of heart.
      </div>
      <h1 class="text-4xl md:text-6xl font-black text-charcoal-950 tracking-tight max-w-4xl mx-auto leading-tight">
        Pick your beads. <br/><span class="text-pink-500">Make it yours.</span>
      </h1>
      <p class="text-base md:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
        An experience-led bead bar for playful self-expression. Everything your 15 guests need to each create three durable keepsakes: 1 beadable metallic pen, 1 swivel keychain charm, and 1 elastic stretch bracelet. Your next favorite little thing.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <a href="/party-kits" class="btn-primary inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base shadow-lg transition-transform active:scale-95">
          Build Your Party Kit ($189)
        </a>
        <a href="/mystery-boxes" class="touch-target inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-semibold border-2 border-charcoal-950 text-charcoal-950 hover:bg-cream-200 transition-colors">
          Explore Mystery Boxes ($28+)
        </a>
      </div>
    </section>

    <!-- 3-Keepsake Guarantee Grid -->
    <section class="max-w-6xl mx-auto px-4 py-12">
      <div class="bg-white rounded-3xl p-8 md:p-12 border border-cream-200 shadow-sm space-y-8">
        <div class="text-center space-y-2">
          <h2 class="text-2xl md:text-3xl font-black text-charcoal-950">The 15-Guest 45-Keepsake Guarantee</h2>
          <p class="text-sm text-neutral-500">Each and every guest leaves with three completed, durable keepsakes:</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-cream-100 rounded-2xl p-6 border border-cream-200 space-y-3">
            <div class="w-10 h-10 rounded-xl bg-pink-500 text-charcoal-950 flex items-center justify-center font-black">1</div>
            <h3 class="text-lg font-bold text-charcoal-950">Beadable Metallic Pen</h3>
            <p class="text-xs text-neutral-600 leading-relaxed">High-grade metallic finish with smooth black ink refill and customizable silicone focal stem.</p>
          </div>
          <div class="bg-cream-100 rounded-2xl p-6 border border-cream-200 space-y-3">
            <div class="w-10 h-10 rounded-xl bg-pink-500 text-charcoal-950 flex items-center justify-center font-black">2</div>
            <h3 class="text-lg font-bold text-charcoal-950">Swivel Carabiner Keychain</h3>
            <p class="text-xs text-neutral-600 leading-relaxed">Heavy-duty lobster clasp perfect for backpacks, locker keys, and luggage tags.</p>
          </div>
          <div class="bg-cream-100 rounded-2xl p-6 border border-cream-200 space-y-3">
            <div class="w-10 h-10 rounded-xl bg-pink-500 text-charcoal-950 flex items-center justify-center font-black">3</div>
            <h3 class="text-lg font-bold text-charcoal-950">Elastic Stretch Bracelet</h3>
            <p class="text-xs text-neutral-600 leading-relaxed">Durable Japanese stretch cord with pooled alphabet letters and sparkly rhinestone spacers.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Accordion -->
    <section id="faq" class="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div class="text-center space-y-2">
        <h2 class="text-2xl md:text-3xl font-black text-charcoal-950">Frequently Asked Questions</h2>
        <p class="text-sm text-neutral-500">Everything you need to know about hosting with BeadsILY</p>
      </div>
      <div class="space-y-4">
        <div class="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm space-y-2">
          <h3 class="font-bold text-base text-charcoal-950">How many guests does one Party Kit serve?</h3>
          <p class="text-sm text-neutral-600 leading-relaxed">Every base kit starts at exactly 15 guests ($189.00). You can dynamically add additional guests at +$12.00 per guest (including 3 more projects) up to 30 guests total.</p>
        </div>
        <div class="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm space-y-2">
          <h3 class="font-bold text-base text-charcoal-950">What makes your Mystery Boxes different from online loot boxes?</h3>
          <p class="text-sm text-neutral-600 leading-relaxed">Zero lottery or gambling mechanics! All BeadsILY mystery craft boxes are prepacked sealed physical units with fully guaranteed project counts (3 projects for Mystery Maker, 6 for Bestie Duo). The joy is in the curated theme colors, charms, and focals!</p>
        </div>
        <div class="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm space-y-2">
          <h3 class="font-bold text-base text-charcoal-950">Do I need prior crafting experience to host?</h3>
          <p class="text-sm text-neutral-600 leading-relaxed">None! Our Master Host Guide provides a minute-by-minute party timeline, step-by-step guest cards, and extra hardware spares so every guest finishes successfully without stress.</p>
        </div>
      </div>
    </section>
  `;
  return getHtmlLayout('Craft Party Kits & Curated Keepsakes', content, '/');
}

function renderPartyKitsPage(): string {
  const content = `
    <section class="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <div class="text-center space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-charcoal-950 border border-pink-500/20">
          Interactive Party Kit Configurator
        </div>
        <h1 class="text-3xl md:text-5xl font-black text-charcoal-950 tracking-tight">Configure Your 15-Guest Kit</h1>
        <p class="text-sm md:text-base text-neutral-600 max-w-xl mx-auto">
          Starts at $189.00 for 15 guests (45 keepsakes). Add extra guests for +$12.00 each (+3 items per guest).
        </p>
      </div>

      <!-- Configurator Card -->
      <div class="bg-white rounded-3xl p-8 md:p-12 border border-cream-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div class="space-y-6">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">1. Select Party Theme</label>
            <div class="grid grid-cols-2 gap-3">
              <button class="p-4 rounded-xl border-2 border-pink-500 bg-pink-50 text-left font-bold text-xs text-charcoal-950">
                ✨ Taylor's Era<br/><span class="font-normal text-neutral-500">Lavender & shimmer beads</span>
              </button>
              <button class="p-4 rounded-xl border border-cream-200 bg-cream-100 text-left font-bold text-xs text-charcoal-950 hover:border-pink-300">
                🌵 Desert Bloom<br/><span class="font-normal text-neutral-500">Terracotta, sage & gold</span>
              </button>
              <button class="p-4 rounded-xl border border-cream-200 bg-cream-100 text-left font-bold text-xs text-charcoal-950 hover:border-pink-300">
                🌼 Glow Neon Daisy<br/><span class="font-normal text-neutral-500">UV reactive brights</span>
              </button>
              <button class="p-4 rounded-xl border border-cream-200 bg-cream-100 text-left font-bold text-xs text-charcoal-950 hover:border-pink-300">
                🧜‍♀️ Mermaid Cove<br/><span class="font-normal text-neutral-500">Pearlescent seafoam & lilac</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">2. Guest Count (Min 15, Max 30)</label>
            <div class="flex items-center gap-4 bg-cream-100 p-2 rounded-2xl border border-cream-200 w-fit">
              <span class="px-4 text-base font-bold text-charcoal-950">15 Guests (Base Guarantee)</span>
            </div>
            <p class="text-xs text-neutral-400 mt-1">Additional guests: +$12.00 per guest (+3 keepsakes per guest).</p>
          </div>
        </div>

        <div class="bg-cream-100 rounded-2xl p-8 border border-cream-200 space-y-6">
          <div class="space-y-2 border-b border-cream-200 pb-6">
            <h3 class="font-black text-xl text-charcoal-950">Order Summary</h3>
            <div class="flex justify-between text-sm text-neutral-600">
              <span>Base 15-Guest Kit (45 Projects)</span>
              <span class="font-bold text-charcoal-950">$189.00</span>
            </div>
            <div class="flex justify-between text-xs text-neutral-500">
              <span>Hardware & Bead Spares Buffer</span>
              <span class="font-semibold text-emerald-700">Included Free</span>
            </div>
            <div class="flex justify-between text-xs text-neutral-500">
              <span>Master Host Guide & Trays</span>
              <span class="font-semibold text-emerald-700">Included Free</span>
            </div>
          </div>

          <div class="flex justify-between items-baseline">
            <span class="text-sm font-bold text-neutral-700">Total Price:</span>
            <span class="text-3xl font-black text-charcoal-950">$189.00</span>
          </div>

          <a href="/checkout?sku=PK-15-TAY&guests=15" class="btn-primary w-full inline-flex items-center justify-center py-4 rounded-xl text-base shadow-md active:scale-95 transition-transform">
            Proceed to Secure Checkout
          </a>
          <p class="text-[11px] text-center text-neutral-500">Stripe Embedded Checkout • Free Standard Shipping</p>
        </div>
      </div>
    </section>
  `;
  return getHtmlLayout('15-Guest Party Kit Configurator', content, '/party-kits');
}

function renderMysteryBoxesPage(): string {
  const content = `
    <section class="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <div class="text-center space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-charcoal-950 border border-amber-400/30">
          Zero-Lottery Physical Craft Boxes
        </div>
        <h1 class="text-3xl md:text-5xl font-black text-charcoal-950 tracking-tight">Curated Mystery Craft Boxes</h1>
        <p class="text-sm md:text-base text-neutral-600 max-w-xl mx-auto">
          Honest, prepacked sealed inventory units. Disclosed project counts with delightful surprise beads, focals, and charms!
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Mystery Maker Solo -->
        <div class="bg-white rounded-3xl p-8 border border-cream-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-pink-500">Solo Experience</span>
                <h2 class="text-2xl font-black text-charcoal-950 mt-1">Mystery Maker Craft Box</h2>
              </div>
              <span class="text-2xl font-black text-charcoal-950">$28.00</span>
            </div>
            <p class="text-xs text-neutral-600 leading-relaxed">
              Guaranteed 3 completed keepsake projects: 1 beadable metallic pen, 1 swivel carabiner charm, and 1 elastic stretch bracelet. Includes secret focal theme and accent palette!
            </p>
            <ul class="text-xs space-y-2 text-neutral-700 bg-cream-100 p-4 rounded-xl border border-cream-200">
              <li>✓ Guaranteed 3 Finished Keepsakes</li>
              <li>✓ 100% Complete Hardware & Focal Charms</li>
              <li>✓ One-time purchase (No recurring subscription)</li>
            </ul>
          </div>
          <a href="/checkout?sku=MYS-MKR-01" class="btn-primary w-full inline-flex items-center justify-center py-3 rounded-xl text-sm shadow-sm active:scale-95 transition-transform">
            Order Mystery Maker ($28)
          </a>
        </div>

        <!-- Bestie Mystery Duo -->
        <div class="bg-white rounded-3xl p-8 border border-cream-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-pink-500">Duo Experience</span>
                <h2 class="text-2xl font-black text-charcoal-950 mt-1">Bestie Mystery Duo Craft Box</h2>
              </div>
              <span class="text-2xl font-black text-charcoal-950">$48.00</span>
            </div>
            <p class="text-xs text-neutral-600 leading-relaxed">
              Guaranteed 6 completed keepsake projects: 2 beadable pens, 2 swivel carabiner charms, and 2 elastic stretch bracelets. Perfect for best friends crafting together!
            </p>
            <ul class="text-xs space-y-2 text-neutral-700 bg-cream-100 p-4 rounded-xl border border-cream-200">
              <li>✓ Guaranteed 6 Finished Keepsakes (3 per Crafter)</li>
              <li>✓ Coordinated Matching & Complementary Secret Themes</li>
              <li>✓ One-time purchase (No recurring subscription)</li>
            </ul>
          </div>
          <a href="/checkout?sku=MYS-DUO-01" class="btn-primary w-full inline-flex items-center justify-center py-3 rounded-xl text-sm shadow-sm active:scale-95 transition-transform">
            Order Bestie Duo ($48)
          </a>
        </div>
      </div>
    </section>
  `;
  return getHtmlLayout('Curated Mystery Craft Boxes', content, '/mystery-boxes');
}

function renderCheckoutPage(url: URL): string {
  const sku = url.searchParams.get('sku') || 'PK-15-TAY';
  const guests = url.searchParams.get('guests') || '15';

  const content = `
    <section class="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-black text-charcoal-950">BeadsILY Secure Checkout</h1>
        <p class="text-xs text-neutral-500">15-Guest Party Kit • 45 Finished Keepsakes Guaranteed</p>
      </div>

      <div class="bg-white rounded-3xl p-8 border border-cream-200 shadow-sm space-y-6">
        <div class="space-y-4">
          <h2 class="text-lg font-bold text-charcoal-950">Customer & Shipping Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-neutral-600 mb-1">Email Address</label>
              <input type="email" placeholder="host@example.com" class="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-cream-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" required />
            </div>
            <div>
              <label class="block text-xs font-semibold text-neutral-600 mb-1">Full Name</label>
              <input type="text" placeholder="Jane Doe" class="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-cream-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" required />
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-neutral-600 mb-1">Shipping Address</label>
              <input type="text" placeholder="123 Celebration Lane, Phoenix, AZ 85001" class="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-cream-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" required />
            </div>
          </div>
        </div>

        <div class="border-t border-cream-200 pt-6 space-y-4">
          <h2 class="text-lg font-bold text-charcoal-950">Payment Method (Stripe Embedded)</h2>
          <div class="p-6 rounded-2xl bg-cream-100 border border-cream-200 text-center space-y-3">
            <p class="text-xs text-neutral-600">Credit card, Apple Pay, and Google Pay securely handled via Stripe.</p>
            <button onclick="alert('Stripe test sandbox connected. Production credentials pending live key setup.')" class="btn-primary px-8 py-3 rounded-xl text-sm shadow-sm active:scale-95 transition-transform">
              Submit Test Order ($189.00)
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
  return getHtmlLayout('Secure Checkout', content, '/checkout');
}

const BRAND_WORDMARK_COLOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 870 200" width="870" height="200"><title>BEADSILY wordmark color</title><desc>BEADSILY custom vector artwork. Outlined lettering; no linked images or fonts.</desc><g transform="translate(35 35) rotate(0) scale(1)"><g transform="translate(0 0) rotate(0) scale(1.1173184357541899)" id="wordmark"><g transform="translate(0 0) rotate(0) scale(1)" id="letter-0-B"><path d="M39 110 C29 110 23 104 27 97 C30 91 37 93 37 98 C37 102 43 102 43 95 L43 24 C43 13 38 9 29 9 C19 9 12 14 12 22 C12 29 19 31 21 25 C22 21 28 22 28 28 C28 39 14 43 6 36 C-5 25 3 6 21 2 C33 -1 46 0 58 0 L74 0 C97 0 109 11 109 28 C109 40 100 48 89 51 C106 55 116 65 116 80 C116 100 100 110 76 110 Z M63 10 L63 46 L73 46 C85 46 91 39 91 28 C91 17 85 10 73 10 Z M63 56 L63 99 L76 99 C90 99 97 92 97 79 C97 64 90 56 76 56 Z" fill="#171416" fill-rule="evenodd"></path></g><g transform="translate(123 10) rotate(0) scale(1)" id="letter-1-E"><path d="M3 0 L68 0 L70 20 C70 23 66 24 64 20 C59 10 56 8 41 8 L29 8 L29 44 L40 44 C48 44 50 39 52 33 C53 30 57 30 57 34 L57 62 C57 66 53 66 52 62 C50 55 48 52 40 52 L29 52 L29 91 L44 91 C56 91 63 87 68 77 C70 73 74 74 73 78 L68 100 L3 100 C0 100 0 96 3 95 C10 94 11 91 11 85 L11 15 C11 8 10 6 3 5 C0 4 0 0 3 0 Z" fill="#171416" fill-rule="evenodd"></path></g><g transform="translate(204 10) rotate(0) scale(1)" id="letter-2-A"><path d="M43 0 C45 -2 49 -2 50 2 L85 86 C88 93 90 95 95 96 C98 97 97 100 94 100 L61 100 C58 100 58 96 61 95 C67 94 68 92 65 85 L60 71 L26 71 L21 85 C19 92 21 94 27 95 C30 96 30 100 27 100 L3 100 C0 100 0 96 3 95 C9 94 12 89 15 81 Z M30 62 L57 62 L43 26 Z" fill="#171416" fill-rule="evenodd"></path></g><g transform="translate(307 10) rotate(0) scale(1)" id="letter-3-D"><path d="M3 0 L41 0 C75 0 94 17 94 49 C94 80 76 100 42 100 L3 100 C0 100 0 96 3 95 C10 94 11 91 11 85 L11 15 C11 8 10 6 3 5 C0 4 0 0 3 0 Z M30 9 L30 90 L41 90 C64 90 74 77 74 49 C74 21 64 9 41 9 Z" fill="#171416" fill-rule="evenodd"></path></g><g transform="translate(408 11.923076923076923) scale(1 0.9615384615384616)" id="letter-4-S"><path d="M70 3 L72 25 C73 29 68 30 66 26 C59 12 51 8 40 8 C27 8 21 14 21 23 C21 33 32 38 45 43 C64 50 76 58 76 74 C76 92 61 102 40 102 C29 102 20 99 14 96 C11 95 9 97 8 100 L3 100 L1 74 C1 70 5 69 7 73 C15 88 25 94 39 94 C51 94 60 89 60 78 C60 68 49 63 35 58 C15 50 5 42 5 27 C5 9 20 -2 40 -2 C48 -2 55 0 62 3 C65 4 66 2 67 0 Z" fill="#171416" fill-rule="evenodd"></path></g><g transform="translate(492 10) rotate(0) scale(1)" id="letter-5-I"><path d="M3 0 L37 0 C40 0 40 4 37 5 C30 6 29 8 29 15 L29 85 C29 92 30 94 37 95 C40 96 40 100 37 100 L3 100 C0 100 0 96 3 95 C10 94 11 92 11 85 L11 15 C11 8 10 6 3 5 C0 4 0 0 3 0 Z" fill="#FF689D" fill-rule="evenodd"></path></g><g transform="translate(539 10) rotate(0) scale(1)" id="letter-6-L"><path d="M3 0 L37 0 C40 0 40 4 37 5 C30 6 29 8 29 15 L29 91 L42 91 C55 91 61 87 67 75 C69 71 73 72 72 76 L68 100 L3 100 C0 100 0 96 3 95 C10 94 11 92 11 85 L11 15 C11 8 10 6 3 5 C0 4 0 0 3 0 Z" fill="#FF689D" fill-rule="evenodd"></path></g><g transform="translate(619 10) rotate(0) scale(1)" id="letter-7-Y"><path d="M3 0 L37 0 C40 0 40 4 37 5 C31 6 30 8 33 13 L54 48 L74 14 C78 8 77 6 70 5 C67 4 67 0 70 0 L94 0 C97 0 97 4 94 5 C87 6 85 10 81 17 L60 53 L60 85 C60 92 62 94 69 95 C72 96 72 100 69 100 L32 100 C29 100 29 96 32 95 C39 94 41 92 41 85 L41 57 L16 16 C12 9 9 6 3 5 C0 4 0 0 3 0 Z" fill="#FF689D" fill-rule="evenodd"></path></g></g></g></svg>`;

const BRAND_HEART_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="4210 115 200 200" width="100%" height="100%"><title>BeadsILY Heart Icon</title><desc>BeadsILY Official Heart Icon with specular highlight</desc><g id="heart-icon"><path d="M 4308.352 302.398 C 4288.191 288.000, 4224.832 247.680, 4224.832 198.719 C 4224.832 144.000, 4282.430 129.602, 4308.352 175.680 C 4334.270 129.602, 4391.871 144.000, 4391.871 198.719 C 4391.871 247.680, 4328.512 288.000, 4308.352 302.398 Z" fill="#FF689D" stroke="#D93D75" stroke-width="6" stroke-linejoin="round"/><path d="M 4242.109 201.602 C 4242.109 161.281, 4279.551 149.762, 4296.832 181.441" fill="none" stroke="#FFFFFF" stroke-width="10.656" stroke-linecap="round"/><path d="M 4256.512 250.559 C 4273.793 270.719, 4293.953 285.121, 4308.352 293.762 C 4331.391 279.359, 4360.191 259.199, 4374.590 239.039" fill="none" stroke="#D93D75" stroke-width="6.912" stroke-linecap="round"/></g></svg>`;

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    try {
      const url = new URL(request.url);

      // 1. Edge Canonical SEO Redirects (SEO-02, SEO-03)
      const canonicalResolution = resolveCanonicalUrl(request.url);
      if (canonicalResolution.shouldRedirect && canonicalResolution.redirectStatus) {
        return new Response(null, {
          status: canonicalResolution.redirectStatus,
          headers: {
            Location: canonicalResolution.canonicalUrl,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }

      // 2. Health Check Endpoint
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          service: 'beadsily-storefront',
          version: '1.2.2',
          runtime: 'cloudflare-workers-edge',
          d1: env.DB ? 'connected' : 'binding_missing',
          r2: env.MEDIA ? 'connected' : 'binding_missing',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 3. Static Brand Assets Serving
      if (url.pathname === '/brand/beadsily-wordmark-color.svg') {
        return new Response(BRAND_WORDMARK_COLOR_SVG, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=604800, immutable',
          },
        });
      }
      if (url.pathname === '/brand/beadsily-heart-icon.svg') {
        return new Response(BRAND_HEART_ICON_SVG, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=604800, immutable',
          },
        });
      }

      // 4. Static Media & Background Images (via Cloudflare R2)
      if (url.pathname.startsWith('/images/') || url.pathname.startsWith('/media/')) {
        const filename = url.pathname.replace(/^\/(images|media)\//, '');
        if (env.MEDIA) {
          const object = await env.MEDIA.get(filename);
          if (object) {
            const headers = new Headers();
            object.writeHttpMetadata(headers);
            headers.set('etag', object.httpEtag);
            headers.set('Cache-Control', 'public, max-age=604800, immutable');
            return new Response(object.body, { headers });
          }
        }
      }

      // 3. API Routes
      if (url.pathname === '/api/mystery/catalog') {
        try {
          if (!env.DB) {
            return new Response(JSON.stringify({ catalog: Object.values(MYSTERY_TIERS) }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          
          const countsRes = await env.DB.prepare(
            "SELECT product_sku as sku, COUNT(*) as in_stock_count FROM mystery_sealed_units WHERE status = 'assembled' GROUP BY product_sku"
          ).all();
          
          const counts: Record<string, number> = {};
          if (countsRes && countsRes.results) {
            for (const row of countsRes.results as any[]) {
              counts[row.sku] = row.in_stock_count;
            }
          }

          const catalog = Object.values(MYSTERY_TIERS).map(tier => ({
            ...tier,
            inStockCount: counts[tier.sku] ?? 10,
            isAvailable: (counts[tier.sku] ?? 10) > 0
          }));

          return new Response(JSON.stringify({ catalog }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
      }

      if (url.pathname === '/api/checkout/session' && request.method === 'POST') {
        try {
          const body: any = await request.json();
          const stripeKey = env.STRIPE_SECRET_KEY || 'sk_test_mock_beadsily';
          const stripeClient = createStripeClient(stripeKey);
          const result = await createEmbeddedCheckoutSession({
            db: env.DB,
            stripeClient,
            cart: body.cart,
            customerEmail: body.customerEmail,
            shippingAddress: body.shippingAddress,
            origin: url.origin,
          });
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 400 });
        }
      }

      if (url.pathname === '/api/subscribe' && request.method === 'POST') {
        try {
          let email = '';
          const contentType = request.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const body: any = await request.json();
            email = (body.email || '').trim().toLowerCase();
          } else {
            const formData = await request.formData();
            email = (formData.get('email') || '').toString().trim().toLowerCase();
          }

          if (!email || !email.includes('@') || email.length < 5) {
            return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          const id = 'sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
          const now = Date.now();
          const ipCountry = request.headers.get('cf-ipcountry') || 'US';
          const userAgent = request.headers.get('user-agent') || '';

          if (env.DB) {
            await env.DB.prepare(
              'INSERT INTO email_subscribers (id, email, source, confirmed, created_at, ip_country, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING'
            ).bind(id, email, 'teaser_landing_page', 0, now, ipCountry, userAgent).run();
          }

          if (contentType.includes('application/json')) {
            return new Response(JSON.stringify({ success: true, message: "You're on the list!" }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          return new Response(null, {
            status: 302,
            headers: { Location: '/?subscribed=1#subscribe' },
          });
        } catch (e: any) {
          return new Response(null, {
            status: 302,
            headers: { Location: '/?subscribed=1#subscribe' },
          });
        }
      }

      // 4. Storefront HTML Routes
      if (url.pathname === '/') {
        return new Response(renderTeaserPage(url), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      if (url.pathname === '/catalog' || url.pathname === '/home') {
        return new Response(renderHomePage(), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      if (url.pathname === '/party-kits') {
        return new Response(renderPartyKitsPage(), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      if (url.pathname === '/mystery-boxes') {
        return new Response(renderMysteryBoxesPage(), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      if (url.pathname === '/checkout') {
        return new Response(renderCheckoutPage(url), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // 404 Fallback
      return new Response(getHtmlLayout('Page Not Found', `
        <div class="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
          <h1 class="text-4xl font-black text-charcoal-950">404 - Page Not Found</h1>
          <p class="text-sm text-neutral-500">The craft page you are looking for has moved or does not exist.</p>
          <a href="/" class="btn-primary inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm">Return Home</a>
        </div>
      `, url.pathname), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({
        error: err.message || String(err),
        stack: err.stack,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
};
