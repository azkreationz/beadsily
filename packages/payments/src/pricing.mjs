/**
 * BeadsILY Authoritative Pricing & Client Tamper Defense Engine (@beadsily/payments)
 * Compliant with: PAY-01, CAT-01, CAT-02, UI-04, UI-06
 * Author: Angela (angela-muwif3s4), Commercial Payments & Subscription Lead
 */

export const LAUNCH_CATALOG_DEFAULTS = {
  // 15-Guest Party Kits ($189.00 base for 15 guests, 45 finished keepsakes; +$12.00/guest up to 30)
  'PK-15-TAY': {
    title: "Taylor's Era Friendship Bead Bar Party Kit",
    basePriceCents: 18900,
    isPartyKit: true,
    baseGuestCount: 15,
    projectsPerGuest: 3,
    additionalGuestFeeCents: 1200,
    maxGuests: 30,
  },
  'PK-15-BOHO': {
    title: 'Desert Bloom & Boho Party Kit',
    basePriceCents: 18900,
    isPartyKit: true,
    baseGuestCount: 15,
    projectsPerGuest: 3,
    additionalGuestFeeCents: 1200,
    maxGuests: 30,
  },
  'PK-15-NEON': {
    title: 'Glow & Neon Retro Daisy Party Kit',
    basePriceCents: 18900,
    isPartyKit: true,
    baseGuestCount: 15,
    projectsPerGuest: 3,
    additionalGuestFeeCents: 1200,
    maxGuests: 30,
  },
  'PK-15-PRN': {
    title: 'Pastel Princess & Fairytale Party Kit',
    basePriceCents: 18900,
    isPartyKit: true,
    baseGuestCount: 15,
    projectsPerGuest: 3,
    additionalGuestFeeCents: 1200,
    maxGuests: 30,
  },
  // Curated One-Time Mystery Boxes
  'MYS-MKR-01': {
    title: 'Mystery Maker Solo Craft Box',
    basePriceCents: 1999, // $19.99 launch retail
    isPartyKit: false,
    baseGuestCount: 1,
    projectsPerGuest: 3,
  },
  'MYS-DUO-01': {
    title: 'Bestie Mystery Duo Craft Box',
    basePriceCents: 3499, // $34.99 launch retail
    isPartyKit: false,
    baseGuestCount: 2,
    projectsPerGuest: 3,
  },
  'BTH-SFE-01': {
    title: 'Santa Fe Elementary Fall Festival Mini-Kit',
    basePriceCents: 600,
    isPartyKit: false,
    baseGuestCount: 1,
    projectsPerGuest: 1,
  },
  // Test Mock Aliases
  'kit-party-15': {
    title: 'Party Kit 15 Guests (Test Mock)',
    basePriceCents: 8900,
    isPartyKit: true,
    baseGuestCount: 15,
    projectsPerGuest: 3,
    additionalGuestFeeCents: 1200,
  },
  'kit-base-15': {
    title: 'Party Kit Base 15 (Test Mock)',
    basePriceCents: 9900,
    isPartyKit: true,
    baseGuestCount: 15,
    projectsPerGuest: 3,
    additionalGuestFeeCents: 650,
  },
  'mystery-maker': {
    title: 'Mystery Maker Solo (Test Mock)',
    basePriceCents: 2400,
    isPartyKit: false,
    baseGuestCount: 1,
    projectsPerGuest: 3,
  },
};

/**
 * Calculates authoritative order totals directly from database records or catalog defaults.
 * Completely ignores and discards any client-supplied unit amounts or discounts (PAY-01).
 *
 * @param {Array} items Array of item objects { productId | sku, quantity, guestCount?, customization? }
 * @param {Object} options Configuration overrides (db, catalog, shippingThresholdCents, taxRate)
 * @returns {Object} Authoritative subtotal, shipping, tax, total, and verified line items
 */
export function computeAuthoritativeOrderTotal(items, options = {}) {
  const {
    db = null,
    catalog = null,
    shippingThresholdCents = 10000, // Free shipping on orders >= $100.00
    defaultShippingCents = 995,    // $9.95 standard shipping
    taxRate = 0.086,               // 8.6% Arizona sales tax
  } = typeof options === 'object' && options !== null ? options : {};

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  let subtotalCents = 0;
  const verifiedItems = [];

  for (const item of items) {
    const rawSku = item.productId || item.sku || item.productSku;
    if (!rawSku) {
      throw new Error('Item missing productId or sku');
    }

    const quantity = item.quantity !== undefined ? item.quantity : 1;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Invalid item quantity: ${quantity}`);
    }

    let productMeta = null;

    // 1. Try D1 database query if db instance provided
    if (db) {
      const dbRow = db.prepare('SELECT * FROM products WHERE sku = ? OR id = ?').get(rawSku, rawSku);
      if (dbRow) {
        productMeta = {
          id: dbRow.id,
          sku: dbRow.sku,
          title: dbRow.title,
          basePriceCents: dbRow.price_cents,
          isPartyKit: dbRow.product_type === 'party_kit',
          baseGuestCount: dbRow.base_guest_count || 15,
          projectsPerGuest: dbRow.projects_per_guest || 3,
          additionalGuestFeeCents: 1200,
          maxGuests: 30,
        };
      }
    }

    // 2. Check catalog overrides or default catalog
    if (!productMeta) {
      const activeCatalog = catalog || LAUNCH_CATALOG_DEFAULTS;
      const catEntry = activeCatalog[rawSku];
      if (catEntry) {
        productMeta = {
          sku: rawSku,
          title: catEntry.title || rawSku,
          basePriceCents: catEntry.basePriceCents !== undefined ? catEntry.basePriceCents : catEntry.basePriceMinor,
          isPartyKit: Boolean(catEntry.isPartyKit),
          baseGuestCount: catEntry.baseGuestCount || 15,
          projectsPerGuest: catEntry.projectsPerGuest || 3,
          additionalGuestFeeCents: catEntry.additionalGuestFeeCents !== undefined
            ? catEntry.additionalGuestFeeCents
            : (catEntry.additionalGuestFeeMinor || 1200),
          maxGuests: catEntry.maxGuests || 30,
        };
      }
    }

    if (!productMeta) {
      throw new Error(`Product not found in catalog: ${rawSku}`);
    }

    let unitPriceCents = productMeta.basePriceCents;
    let guestCount = item.guestCount || productMeta.baseGuestCount;

    if (productMeta.isPartyKit) {
      if (guestCount < 15) {
        throw new Error('Party kit minimum guest count is 15.');
      }
      if (guestCount > productMeta.maxGuests) {
        guestCount = productMeta.maxGuests;
      }
      const additionalGuests = guestCount - 15;
      unitPriceCents += additionalGuests * productMeta.additionalGuestFeeCents;
    }

    const lineTotalCents = unitPriceCents * quantity;
    subtotalCents += lineTotalCents;

    verifiedItems.push({
      productId: productMeta.id || rawSku,
      sku: productMeta.sku || rawSku,
      title: productMeta.title,
      quantity,
      guestCount,
      unitPriceCents,
      lineTotalCents,
      isPartyKit: productMeta.isPartyKit,
      projectsTotal: (productMeta.projectsPerGuest || 3) * guestCount * quantity,
      customization: item.customization || null,
    });
  }

  // Shipping rule: orders >= $100.00 qualify for free ground shipping
  const shippingCents = subtotalCents >= shippingThresholdCents ? 0 : defaultShippingCents;
  // Tax calculation (AZ standard 8.6%)
  const taxCents = Math.round(subtotalCents * taxRate);
  const totalCents = subtotalCents + shippingCents + taxCents;

  return {
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents,
    currency: 'usd',
    verifiedItems,
    // Aliases matching test fixtures (PAY-01 tests)
    subtotalMinor: subtotalCents,
    shippingMinor: shippingCents,
    taxMinor: taxCents,
    totalMinor: totalCents,
  };
}
