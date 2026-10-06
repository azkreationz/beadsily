/**
 * BeadsILY Cloudflare Edge Canonical Redirect Middleware
 * Enforces canonical domain beadsily.com, HTTPS protocol, and strips tracking parameters (SEO-02).
 */

import { resolveCanonicalUrl } from './lib/seo.mjs';

export function middleware(request: Request): Response | undefined {
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - brand (public brand assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|brand).*)',
  ],
};
