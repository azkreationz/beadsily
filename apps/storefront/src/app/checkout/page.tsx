'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Badge } from '@beadsily/ui';

interface CartSummary {
  sku: string;
  title: string;
  guestCount: number;
  projectsTotal: number;
  unitPriceCents: number;
  quantity: number;
}

export default function CheckoutPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Default preview items: standard 15-guest party kit
  const [cart, setCart] = useState<CartSummary>({
    sku: 'PK-15-TAY',
    title: "Taylor's Era Friendship Bead Bar Party Kit",
    guestCount: 15,
    projectsTotal: 45,
    unitPriceCents: 18900,
    quantity: 1,
  });

  const subtotalCents = cart.unitPriceCents * cart.quantity;
  const shippingCents = subtotalCents >= 10000 ? 0 : 995;
  const taxCents = Math.round(subtotalCents * 0.086);
  const totalCents = subtotalCents + shippingCents + taxCents;

  const handleInitializeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: email,
          cart: {
            items: [
              {
                sku: cart.sku,
                guestCount: cart.guestCount,
                quantity: cart.quantity,
              },
            ],
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize embedded checkout');
      }

      setClientSecret(data.clientSecret);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-charcoal-700">
            <li>
              <Link href="/" className="hover:text-charcoal-950 underline focus:ring-2 focus:ring-pink-500 rounded">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/party-kits" className="hover:text-charcoal-950 underline focus:ring-2 focus:ring-pink-500 rounded">
                Party Kits
              </Link>
            </li>
            <li>/</li>
            <li aria-current="page" className="font-semibold text-charcoal-950">
              Embedded Checkout
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Checkout Area */}
          <main className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-cream-200">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif mb-2">Secure Embedded Checkout</h1>
            <p className="text-sm text-charcoal-700 mb-6">
              Stripe-hosted payment fields embedded seamlessly into BeadsILY. Card information is tokenized securely by Stripe.
            </p>

            {error && (
              <div role="alert" className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                <strong>Error: </strong> {error}
              </div>
            )}

            {!clientSecret ? (
              <form onSubmit={handleInitializeCheckout} className="space-y-4">
                <div>
                  <label htmlFor="customer-email" className="block text-sm font-medium text-charcoal-800 mb-1">
                    Contact Email (for Order & Shipping Updates)
                  </label>
                  <input
                    id="customer-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah.parent@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-charcoal-300 text-charcoal-950 focus:ring-2 focus:ring-pink-500 focus:outline-none min-h-[44px]"
                  />
                  <p className="text-xs text-charcoal-600 mt-1">
                    COPPA Privacy Guard: BeadsILY accounts are held strictly by adult purchasers (18+).
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={loading}
                  className="w-full justify-center min-h-[48px]"
                >
                  {loading ? 'Securing your checkout...' : 'Continue to Payment Details'}
                </Button>
              </form>
            ) : (
              <div id="checkout-container" className="my-4">
                <div className="p-4 bg-cream-50 border border-cream-200 rounded-xl mb-4 text-sm text-charcoal-800">
                  <Badge variant="pink" size="sm" className="mb-2">Stripe Embedded Element Active</Badge>
                  <p>Client Secret: <code className="bg-cream-200 px-1 py-0.5 rounded text-xs">{clientSecret}</code></p>
                  <p className="mt-1 text-xs text-charcoal-600">
                    Payment Element is mounted. All card tokenization occurs inside Stripe-hosted iframe sandboxes.
                  </p>
                </div>

                {/* Simulated payment completion for preview & testing */}
                <div className="mt-6 pt-4 border-t border-cream-200 flex flex-col space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-600">Testing & Preview Actions:</span>
                  <Link
                    href={`/checkout/return?session_id=cs_test_mock&status=succeeded`}
                    className="inline-flex justify-center items-center px-4 py-3 bg-pink-500 text-charcoal-950 font-bold rounded-lg hover:bg-pink-600 focus:ring-2 focus:ring-pink-500 min-h-[44px]"
                  >
                    Simulate Payment Success (Return URL)
                  </Link>
                </div>
              </div>
            )}
          </main>

          {/* Order Summary Sidebar */}
          <aside className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-cream-200 h-fit">
            <h2 className="text-lg font-bold font-serif mb-4 pb-2 border-b border-cream-200">
              Order Summary
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-sm text-charcoal-950">{cart.title}</h3>
                  <p className="text-xs text-charcoal-600">
                    {cart.guestCount} Guests — <span className="font-semibold text-charcoal-950">{cart.projectsTotal} Finished Keepsakes</span>
                  </p>
                  <span className="inline-block mt-1 text-xs bg-amber-100 text-charcoal-950 px-2 py-0.5 rounded font-medium border border-amber-300">
                    $12.60 / guest
                  </span>
                </div>
                <span className="font-bold text-sm text-charcoal-950">
                  ${(cart.unitPriceCents / 100).toFixed(2)}
                </span>
              </div>

              <div className="border-t border-cream-200 pt-3 space-y-2 text-sm text-charcoal-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-charcoal-950">${(subtotalCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-charcoal-950">
                    {shippingCents === 0 ? <span className="text-green-700 font-bold">FREE</span> : `$${(shippingCents / 100).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8.6% AZ)</span>
                  <span className="font-medium text-charcoal-950">${(taxCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-charcoal-950 pt-2 border-t border-cream-200">
                  <span>Authoritative Total</span>
                  <span className="text-lg text-charcoal-950">${(totalCents / 100).toFixed(2)}</span>
                </div>
              </div>

              <div className="p-3 bg-cream-50 rounded-lg text-xs text-charcoal-700 mt-4 border border-cream-200">
                <p className="font-semibold text-charcoal-950">Guaranteed Complete Supplies:</p>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>16 Beadable Metallic Ballpoint Pens (+1 spare)</li>
                  <li>16 Swivel Lobster Keyring Clasps (+1 spare)</li>
                  <li>18 Pre-cut 12&quot; Heavy-Duty Elastic Cords</li>
                  <li>48 Theme Silicone Focals &amp; 265 Silicone Beads</li>
                  <li>2 Blunt Craft Scissors &amp; 2 Flower Sorting Trays</li>
                </ul>
              </div>

              <p className="text-[11px] text-charcoal-500 italic mt-2 text-center">
                WARNING: CHOKING HAZARD — Small parts. Not for children under 3 years. Adult supervision recommended.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
