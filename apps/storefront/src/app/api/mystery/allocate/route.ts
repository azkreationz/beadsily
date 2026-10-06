/**
 * Storefront API Route: POST /api/mystery/allocate
 * Allocates a prepacked sealed mystery unit to an active checkout session.
 * Compliant with: MYS-02, MYS-03, MYS-04, MYS-05
 */

import { allocateSealedMysteryUnit, sanitizeMysteryUnitForPublicClient } from '@beadsily/db';

export async function POST(request: Request, context: { env?: any }) {
  try {
    const body = await request.json();
    const env = context?.env || process.env;
    const db = env?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'DATABASE_UNAVAILABLE: D1 binding missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const {
      sessionId,
      orderId,
      productSku,
      customerPreviousThemes = [],
      firmVarietyGuarantee = false
    } = body;

    if (!sessionId && !orderId) {
      return new Response(JSON.stringify({ error: 'VALIDATION_ERROR: sessionId or orderId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = allocateSealedMysteryUnit(db, {
      sessionId,
      orderId,
      productSku,
      customerPreviousThemes,
      firmVarietyGuarantee
    });

    if (!result.allocated) {
      const status = result.error === 'OUT_OF_STOCK' || result.error === 'RACE_LOST' ? 409
        : result.error === 'VARIETY_GUARANTEE_UNAVAILABLE' ? 409
        : 400;

      return new Response(JSON.stringify({ error: result.error }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Public API sanitization: Internal surprise focals and warehouse bins stripped (MYS-05)
    const sanitizedUnit = sanitizeMysteryUnitForPublicClient(result.unit);

    return new Response(JSON.stringify({
      allocated: true,
      unit: sanitizedUnit,
      retried: result.retried,
      repeatTheme: result.repeatTheme || false
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
