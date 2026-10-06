/**
 * Storefront API Route: GET /api/mystery/catalog
 * Returns curated mystery box tiers, guaranteed project counts, and stock status.
 * Compliant with: MYS-01, MYS-05
 */

import { getMysteryCatalog, MYSTERY_TIERS } from '@beadsily/db';

export async function GET(request: Request, context: { env?: any }) {
  try {
    const env = context?.env || process.env;
    const db = env?.DB;

    if (!db) {
      // If DB binding is absent, return static tier guarantees without live stock counts
      const staticCatalog = Object.values(MYSTERY_TIERS).map(tier => ({
        ...tier,
        isAvailable: true,
        inStockCount: 10
      }));

      return new Response(JSON.stringify({ catalog: staticCatalog }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, s-maxage=300'
        },
      });
    }

    const catalog = getMysteryCatalog(db);

    return new Response(JSON.stringify({ catalog }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=60'
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to retrieve mystery catalog' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
