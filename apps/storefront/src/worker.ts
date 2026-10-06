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
      background: linear-gradient(180deg, rgba(23, 20, 22, 0.80) 0%, rgba(23, 20, 22, 0.65) 45%, rgba(23, 20, 22, 0.88) 100%),
                  url('https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=2000&q=85') center/cover no-repeat fixed;
    }
  </style>
</head>
<body class="${isTeaser ? 'bg-charcoal-950 text-cream-100' : 'bg-cream-100 text-charcoal-950'} font-sans antialiased min-h-screen flex flex-col">
  <!-- Top Announcement Bar -->
  <aside aria-label="Announcement" class="bg-charcoal-950 text-cream-100 text-xs py-2 px-4 text-center font-medium border-b border-white/10">
    ✨ Soft Launch Event: Santa Fe Elementary Fall Festival (Friday, Oct 23, 2026, 5–8 PM Arizona MST) • Pre-order Party Kits Below
  </aside>

  <!-- Navigation Header -->
  <header class="${isTeaser ? 'border-b border-white/10 bg-charcoal-950/70 backdrop-blur sticky top-0 z-50' : 'border-b border-cream-200 bg-white/80 backdrop-blur sticky top-0 z-50'}">
    <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2 group">
        <span class="text-2xl font-black tracking-tight">
          <span class="${isTeaser ? 'text-white' : 'text-charcoal-950'}">BEADS</span><span class="text-pink-500">ILY</span>
        </span>
        <span class="font-display tracking-widest uppercase text-[11px] font-semibold ${isTeaser ? 'text-cream-200 bg-white/10 border-white/20' : 'text-charcoal-950 bg-pink-50 border-pink-500/20'} px-2.5 py-0.5 rounded-full border">Bead Bar</span>
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm font-semibold ${isTeaser ? 'text-cream-100' : 'text-charcoal-900'}">
        <a href="/party-kits" class="hover:text-pink-400 transition-colors ${currentPath === '/party-kits' ? 'text-pink-400 font-bold' : ''}">15-Guest Party Kits</a>
        <a href="/mystery-boxes" class="hover:text-pink-400 transition-colors ${currentPath === '/mystery-boxes' ? 'text-pink-400 font-bold' : ''}">Curated Mystery Boxes</a>
        <a href="/party-kits#faq" class="hover:text-pink-400 transition-colors">Host Guide & FAQ</a>
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
          version: '1.2.0',
          runtime: 'cloudflare-workers-edge',
          d1: env.DB ? 'connected' : 'binding_missing',
          r2: env.MEDIA ? 'connected' : 'binding_missing',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
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
