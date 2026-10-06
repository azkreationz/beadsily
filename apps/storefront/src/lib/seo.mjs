/**
 * BeadsILY Technical SEO & Structured Data Library (ESM)
 * Implements Schema.org JSON-LD generation, canonical URL resolution, and social metadata.
 * Requirements: SEO-01, SEO-02, BCF-15
 */

export const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'guest_name',
  'fbclid',
  'gclid',
];

/**
 * Generates valid Schema.org Product and Offer structured data with accurate
 * minor unit pricing and stock availability (SEO-01).
 */
export function generateProductSchema(product) {
  const schema = {
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
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://beadsily.com/products/${product.slug}`,
    },
  };

  if (product.image) {
    schema.image = product.image;
  }

  return schema;
}

/**
 * Generates Schema.org Organization structured data for BeadsILY brand identity.
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BeadsILY',
    url: 'https://beadsily.com',
    logo: 'https://beadsily.com/brand/beadsily-logo.svg',
    founder: {
      '@type': 'Person',
      name: 'Lua',
    },
    sameAs: [
      'https://www.instagram.com/beadsily',
      'https://www.facebook.com/beadsily',
    ],
  };
}

/**
 * Generates Schema.org FAQPage structured data from FAQ item lists.
 */
export function generateFaqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.title,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.contentText || faq.title,
      },
    })),
  };
}

/**
 * Evaluates and normalizes request URLs to enforce canonical origin beadsily.com,
 * HTTPS protocol, and strips tracking/personalization parameters (SEO-02).
 */
export function resolveCanonicalUrl(requestUrl) {
  const parsed = new URL(requestUrl);

  // 1. Domain Canonicalization: beadsilly.com, www.beadsilly.com, www.beadsily.com -> beadsily.com
  let hostname = parsed.hostname;
  let shouldRedirect = false;
  if (
    hostname === 'beadsilly.com' ||
    hostname === 'www.beadsilly.com' ||
    hostname === 'www.beadsily.com'
  ) {
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
    if (!TRACKING_PARAMS.includes(key)) {
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

/**
 * Helper to build standard Next.js social metadata including OpenGraph and Twitter Cards.
 */
export function buildSocialMetadata(options) {
  const canonicalUrl = `https://beadsily.com${options.path === '/' ? '' : options.path}`;
  const defaultImage = 'https://beadsily.com/brand/beadsily-logo.svg';
  const ogImage = options.image || defaultImage;

  return {
    title: `${options.title} | BeadsILY`,
    description: options.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${options.title} | BeadsILY`,
      description: options.description,
      url: canonicalUrl,
      siteName: 'BeadsILY',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${options.title} — BeadsILY`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${options.title} | BeadsILY`,
      description: options.description,
      images: [ogImage],
    },
  };
}
