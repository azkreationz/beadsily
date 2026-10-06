/**
 * Storefront / Staff API Route: POST /api/mystery/return-audit
 * Audits damaged mystery box returns against actual packed lot contents.
 * Compliant with: MYS-06, INV-08
 */

import { auditMysteryRestock } from '@beadsily/db';

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
      sealedUnitId,
      notes = 'Damaged component reported by customer',
      restockEligible = false,
      inspectorId = 'pam-muwic8fg'
    } = body;

    if (!sealedUnitId) {
      return new Response(JSON.stringify({ error: 'VALIDATION_ERROR: sealedUnitId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = auditMysteryRestock(db, {
      sealedUnitId,
      notes,
      restockEligible,
      inspectorId
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const status = err.message?.startsWith('UNIT_NOT_FOUND') ? 404 : 500;
    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
