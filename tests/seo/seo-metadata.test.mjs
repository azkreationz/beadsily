/**
 * BeadsILY Acceptance Test Suite: Technical SEO, SSR & Structured Data
 * Requirements: SEO-01, SEO-02, BCF-15
 * Authored by: Jan (jan-muwig5mo), Organic Search & Growth Strategist
 * Verified by: Toby (toby-muwie8nd), Independent QA Certifier
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Import production implementations from storefront SEO library
import {
  generateProductSchema,
  resolveCanonicalUrl,
  generateOrganizationSchema,
  generateFaqSchema,
  buildSocialMetadata,
} from '../../apps/storefront/src/lib/seo.mjs';

// Import Edge Middleware
import { middleware } from '../../apps/storefront/src/middleware.mjs';

describe('SEO-01: Product SSR Structured Data & Availability', () => {
  test('Generates valid Schema.org Product and Offer JSON-LD with real minor unit price and InStock', () => {
    const product = {
      title: '15-Person BeadsILY Party Kit',
      description: 'Complete DIY bead bar kit for 15 guests with 45 finished projects.',
      sku: 'KIT-PARTY-15',
      priceCents: 9900,
      inStock: true,
      slug: '15-person-party-kit',
    };

    const schema = generateProductSchema(product);
    assert.equal(schema['@type'], 'Product');
    assert.equal(schema.name, '15-Person BeadsILY Party Kit');
    assert.equal(schema.offers.price, '99.00');
    assert.equal(schema.offers.priceCurrency, 'USD');
    assert.equal(schema.offers.availability, 'https://schema.org/InStock');
    assert.equal(schema.offers.url, 'https://beadsily.com/products/15-person-party-kit');
    assert.equal(schema.brand.name, 'BeadsILY');
  });

  test('Generates valid Schema.org Product for 15-Guest Taylor Era Launch Kit ($189.00)', () => {
    const kit = {
      title: "Taylor's Era Friendship Bead Bar Kit",
      description: 'Concert-ready friendship bead bar for 15 guests (45 finished projects).',
      sku: 'PK-15-TAY',
      priceCents: 18900,
      inStock: true,
      slug: 'taylors-era-friendship-kit',
    };

    const schema = generateProductSchema(kit);
    assert.equal(schema['@type'], 'Product');
    assert.equal(schema.offers.price, '189.00');
    assert.equal(schema.offers.availability, 'https://schema.org/InStock');
    assert.equal(schema.offers.url, 'https://beadsily.com/products/taylors-era-friendship-kit');
  });

  test('Sold out item returns accurate OutOfStock schema rather than 404', () => {
    const soldOutProduct = {
      title: 'Limited Edition Halloween Mystery Box',
      description: 'Spooky beads and charms.',
      sku: 'MYS-HW-01',
      priceCents: 2400,
      inStock: false,
      slug: 'halloween-mystery-box',
    };

    const schema = generateProductSchema(soldOutProduct);
    assert.equal(schema.offers.availability, 'https://schema.org/OutOfStock');
    assert.equal(schema.offers.price, '24.00');
  });

  test('Generates valid Schema.org Product for Curated Mystery Maker ($28.00)', () => {
    const mystery = {
      title: 'Mystery Maker Solo Craft Box',
      description: 'Prepacked sealed craft surprise box with guaranteed supplies for 3 complete projects.',
      sku: 'MYS-MKR-01',
      priceCents: 2800,
      inStock: true,
      slug: 'mystery-maker-solo',
    };

    const schema = generateProductSchema(mystery);
    assert.equal(schema['@type'], 'Product');
    assert.equal(schema.offers.price, '28.00');
    assert.equal(schema.offers.availability, 'https://schema.org/InStock');
  });
});

describe('SEO-02: Domain & Parameter Canonicalization (301 Permanent Redirects)', () => {
  test('Redirects wrong domain alias beadsilly.com to canonical beadsily.com with 301', () => {
    const res = resolveCanonicalUrl('http://beadsilly.com/products/party-kit');
    assert.equal(res.shouldRedirect, true);
    assert.equal(res.redirectStatus, 301);
    assert.equal(res.canonicalUrl, 'https://beadsily.com/products/party-kit');
  });

  test('Redirects www subdomain www.beadsily.com to apex canonical beadsily.com', () => {
    const res = resolveCanonicalUrl('https://www.beadsily.com/party-kits');
    assert.equal(res.shouldRedirect, true);
    assert.equal(res.redirectStatus, 301);
    assert.equal(res.canonicalUrl, 'https://beadsily.com/party-kits');
  });

  test('Strips personalization tracking parameters to avoid crawl explosion', () => {
    const res = resolveCanonicalUrl('https://beadsily.com/products/party-kit?ref=instagram&guest_name=Sarah');
    assert.equal(res.shouldRedirect, true);
    assert.equal(res.canonicalUrl, 'https://beadsily.com/products/party-kit');
  });

  test('Strips UTM marketing parameters in canonical resolution', () => {
    const res = resolveCanonicalUrl('https://beadsily.com/mystery-boxes?utm_source=facebook&utm_medium=cpc');
    assert.equal(res.shouldRedirect, true);
    assert.equal(res.canonicalUrl, 'https://beadsily.com/mystery-boxes');
  });

  test('Canonical URL matches production destination directly for clean URL', () => {
    const res = resolveCanonicalUrl('https://beadsily.com/products/party-kit');
    assert.equal(res.shouldRedirect, false);
    assert.equal(res.canonicalUrl, 'https://beadsily.com/products/party-kit');
  });
});

describe('SEO-03: Cloudflare Edge Canonical Redirect Middleware', () => {
  test('Middleware intercepts alias request and returns 301 Response with Location header', () => {
    const req = new Request('http://beadsilly.com/party-kits');
    const response = middleware(req);
    assert.ok(response instanceof Response);
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('Location'), 'https://beadsily.com/party-kits');
    assert.ok(response.headers.get('Cache-Control')?.includes('max-age=31536000'));
  });

  test('Middleware intercepts tracking query params and returns 301 to clean URL', () => {
    const req = new Request('https://beadsily.com/mystery-boxes?utm_campaign=fall_launch&ref=tiktok');
    const response = middleware(req);
    assert.ok(response instanceof Response);
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('Location'), 'https://beadsily.com/mystery-boxes');
  });

  test('Middleware passes through clean canonical requests without redirecting', () => {
    const req = new Request('https://beadsily.com/party-kits');
    const response = middleware(req);
    assert.equal(response, undefined);
  });
});

describe('SEO-04: Organization, FAQ & Social Metadata Specifications', () => {
  test('Generates Organization schema with Founder Lua, official logo, and social links', () => {
    const org = generateOrganizationSchema();
    assert.equal(org['@type'], 'Organization');
    assert.equal(org.name, 'BeadsILY');
    assert.equal(org.url, 'https://beadsily.com');
    assert.equal(org.founder.name, 'Lua');
    assert.ok(Array.isArray(org.sameAs));
  });

  test('Generates valid FAQPage schema from items list', () => {
    const faqs = [
      { title: 'What is included in each party kit?', contentText: 'Supplies for 45 finished projects.' },
      { title: 'How long does assembly take?', contentText: 'Approximately 60-90 minutes.' },
    ];
    const faqSchema = generateFaqSchema(faqs);
    assert.equal(faqSchema['@type'], 'FAQPage');
    assert.equal(faqSchema.mainEntity.length, 2);
    assert.equal(faqSchema.mainEntity[0].name, 'What is included in each party kit?');
    assert.equal(faqSchema.mainEntity[0].acceptedAnswer.text, 'Supplies for 45 finished projects.');
  });

  test('Builds social OpenGraph and Twitter Card metadata with canonical URL', () => {
    const meta = buildSocialMetadata({
      title: '15-Guest Party Kits',
      description: 'Craft 45 boutique accessories.',
      path: '/party-kits',
    });
    assert.equal(meta.title, '15-Guest Party Kits | BeadsILY');
    assert.equal(meta.alternates.canonical, 'https://beadsily.com/party-kits');
    assert.equal(meta.openGraph.url, 'https://beadsily.com/party-kits');
    assert.equal(meta.twitter.card, 'summary_large_image');
  });
});
