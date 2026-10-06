/**
 * BeadsILY Authoritative Pricing & Client Tamper Defense Engine (@beadsily/payments)
 * Compliant with: PAY-01, CAT-01, CAT-02, UI-04, UI-06
 */

export interface CatalogEntry {
  title: string;
  basePriceCents: number;
  isPartyKit: boolean;
  baseGuestCount: number;
  projectsPerGuest?: number;
  additionalGuestFeeCents?: number;
  maxGuests?: number;
  [key: string]: any;
}

export interface OrderItemInput {
  productId?: string;
  sku?: string;
  productSku?: string;
  quantity?: number;
  guestCount?: number;
  customization?: any;
  [key: string]: any;
}

export interface VerifiedLineItem {
  productId: string;
  sku: string;
  title: string;
  quantity: number;
  guestCount: number;
  unitPriceCents: number;
  lineTotalCents: number;
  isPartyKit: boolean;
  projectsTotal: number;
  customization?: any;
}

export interface AuthoritativeOrderTotal {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  verifiedItems: VerifiedLineItem[];
  subtotalMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export { LAUNCH_CATALOG_DEFAULTS, computeAuthoritativeOrderTotal } from './pricing.mjs';
