/**
 * BeadsILY Acceptance Test Suite: Technical SEO, SSR & Structured Data
 * Requirements: SEO-01, SEO-02
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

function generateProductSchema(product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'BeadsILY',
    },
    offers: {
      '@type': 'Offer',
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://beadsily.com/products/${product.slug}`,
    },
  };
}

function resolveCanonicalUrl(requestUrl) {
  const parsed = new URL(requestUrl);

  // 1. Domain Canonicalization: beadsilly.com -> beadsily.com
  let hostname = parsed.hostname;
  let shouldRedirect = false;
  if (hostname === 'beadsilly.com' || hostname === 'www.beadsilly.com' || hostname === 'www.beadsily.com') {
    hostname = 'beadsily.com';
    shouldRedirect = true;
  }

  // 2. Protocol Canonicalization: http -> https
  let protocol = parsed.protocol;
  if (protocol === 'http:') {
    protocol = 'https:';
    shouldRedirect = true;
  }

  // 3. Strip tracking / personalization query params to prevent crawl explosion
  const cleanSearchParams = new URLSearchParams();
  for (const [key, value] of parsed.searchParams.entries()) {
    if (!['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'guest_name'].includes(key)) {
      cleanSearchParams.append(key, value);
    } else {
      shouldRedirect = true;
    }
  }

  const cleanQuery = cleanSearchParams.toString() ? `?${cleanSearchParams.toString()}` : '';
  const canonicalUrl = `${protocol}//${hostname}${parsed.pathname}${cleanQuery}`;

  return {
    canonicalUrl,
    shouldRedirect,
    redirectStatus: shouldRedirect ? 301 : null,
  };
}

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
});

describe('SEO-02: Domain & Parameter Canonicalization (301 Permanent Redirects)', () => {
  test('Redirects wrong domain alias beadsilly.com to canonical beadsily.com with 301', () => {
    const res = resolveCanonicalUrl('http://beadsilly.com/products/party-kit');
    assert.equal(res.shouldRedirect, true);
    assert.equal(res.redirectStatus, 301);
    assert.equal(res.canonicalUrl, 'https://beadsily.com/products/party-kit');
  });

  test('Strips personalization tracking parameters to avoid crawl explosion', () => {
    const res = resolveCanonicalUrl('https://beadsily.com/products/party-kit?ref=instagram&guest_name=Sarah');
    assert.equal(res.shouldRedirect, true);
    assert.equal(res.canonicalUrl, 'https://beadsily.com/products/party-kit');
  });

  test('Canonical URL matches production destination directly for clean URL', () => {
    const res = resolveCanonicalUrl('https://beadsily.com/products/party-kit');
    assert.equal(res.shouldRedirect, false);
    assert.equal(res.canonicalUrl, 'https://beadsily.com/products/party-kit');
  });
});
