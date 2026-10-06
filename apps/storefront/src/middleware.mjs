/**
 * BeadsILY Cloudflare Edge Canonical Redirect Middleware (ESM)
 * Enforces canonical domain beadsily.com, HTTPS protocol, and strips tracking parameters (SEO-02).
 */

import { resolveCanonicalUrl } from './lib/seo.mjs';

export function middleware(request) {
  const url = request.url;
  const resolution = resolveCanonicalUrl(url);

  if (resolution.shouldRedirect && resolution.redirectStatus) {
    return new Response(null, {
      status: resolution.redirectStatus,
      headers: {
        Location: resolution.canonicalUrl,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  return undefined;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|brand).*)',
  ],
};
