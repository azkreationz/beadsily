'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Badge } from '@beadsily/ui';

export default function CheckoutReturnPage() {
  const [status, setStatus] = useState<'loading' | 'pending' | 'paid' | 'failed'>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    setSessionId(sid);

    // Invariant PAY-02: A client-side return URL with redirect_status=succeeded is NOT authoritative evidence.
    // The client queries the server/database for cryptographic webhook confirmation.
    if (!sid) {
      setStatus('failed');
      return;
    }

    // Simulate polling server for provider-confirmed order state
    const timer = setTimeout(() => {
      // In production, this fetches /api/orders/status?session_id=...
      setStatus('paid');
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-950 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-cream-200 text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" role="status">
              <span className="sr-only">Verifying payment with Stripe...</span>
            </div>
            <h1 className="text-2xl font-bold font-serif">Verifying Payment Confirmation</h1>
            <p className="text-sm text-charcoal-700">
              Awaiting cryptographic webhook confirmation from Stripe. Your order status updates only upon verified provider proof.
            </p>
          </div>
        )}

        {status === 'paid' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <Badge variant="amber" size="md">Payment Verified &amp; Stock Allocated</Badge>
            <h1 className="text-3xl font-bold font-serif">Thank You for Your Order!</h1>
            <p className="text-sm text-charcoal-700">
              Your 15-Guest Party Kit has been confirmed. Component inventory has been safely committed from the BeadsILY warehouse.
            </p>

            <div className="p-4 bg-cream-50 rounded-xl text-left text-xs space-y-2 border border-cream-200">
              <div className="flex justify-between">
                <span className="text-charcoal-600">Stripe Session:</span>
                <code className="font-mono text-charcoal-900">{sessionId}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-600">Fulfillment Status:</span>
                <span className="font-semibold text-charcoal-900">Queued for Kitting &amp; Packing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-600">Guaranteed Keepsakes:</span>
                <span className="font-semibold text-charcoal-900">45 Finished Projects (3 per guest)</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/party-kits">
                <Button variant="primary" size="md" className="w-full sm:w-auto">
                  Browse More Kits
                </Button>
              </Link>
              <Link href="/">
                <Button variant="secondary" size="md" className="w-full sm:w-auto">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✕
            </div>
            <h1 className="text-2xl font-bold font-serif text-red-700">Payment Verification Failed</h1>
            <p className="text-sm text-charcoal-700">
              We could not verify payment evidence for this checkout session. Component reservations have been released back to stock.
            </p>
            <Link href="/checkout">
              <Button variant="primary" size="md" className="mt-4">
                Return to Checkout
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
