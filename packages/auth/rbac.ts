/**
 * BeadsILY Staff Role-Based Access Control (RBAC) Middleware & Guards
 * Clean-room implementation matching THREAT-MODEL.md and ACCEPTANCE-MATRIX SEC-01.
 */

import type { SessionPayload } from './session.ts';

export type StaffRole = 'owner' | 'packer' | 'support' | 'auditor';
export type UserRole = StaffRole | 'customer' | 'anonymous';

export const STAFF_ROLES: readonly StaffRole[] = ['owner', 'packer', 'support', 'auditor'] as const;
export const ALL_ROLES: readonly UserRole[] = [...STAFF_ROLES, 'customer', 'anonymous'] as const;

export type SystemAction =
  | 'browse_catalog'
  | 'create_cart_reservation'
  | 'execute_checkout'
  | 'view_own_order'
  | 'manage_own_subscription'
  | 'view_packing_lists'
  | 'mark_order_shipped'
  | 'record_component_intake'
  | 'update_shipping_address'
  | 'issue_refund'
  | 'modify_catalog_pricing'
  | 'modify_bom_recipes'
  | 'view_movement_ledger'
  | 'view_financial_metrics'
  | 'manage_staff_accounts';

export const ROLE_PERMISSION_MAP: Record<SystemAction, readonly UserRole[]> = {
  browse_catalog: ['anonymous', 'customer', 'packer', 'support', 'auditor', 'owner'],
  create_cart_reservation: ['anonymous', 'customer', 'owner'],
  execute_checkout: ['anonymous', 'customer', 'owner'],
  view_own_order: ['customer', 'owner'],
  manage_own_subscription: ['customer', 'owner'],
  view_packing_lists: ['packer', 'support', 'auditor', 'owner'],
  mark_order_shipped: ['packer', 'support', 'owner'],
  record_component_intake: ['packer', 'owner'],
  update_shipping_address: ['support', 'owner'],
  issue_refund: ['support', 'owner'],
  modify_catalog_pricing: ['owner'],
  modify_bom_recipes: ['owner'],
  view_movement_ledger: ['auditor', 'owner'],
  view_financial_metrics: ['owner'],
  manage_staff_accounts: ['owner'],
};

export interface AuthorizationResult {
  authorized: boolean;
  status: 200 | 401 | 403;
  error?: string;
  requiredRoles?: readonly UserRole[];
}

/**
 * Checks if a user role is permitted to perform a system action.
 */
export function isActionPermitted(role: UserRole | undefined | null, action: SystemAction): boolean {
  if (!role || !ALL_ROLES.includes(role)) return false;
  const allowed = ROLE_PERMISSION_MAP[action];
  return allowed ? allowed.includes(role) : false;
}

/**
 * Enforces role requirement on an authenticated session.
 */
export function authorizeSessionRole(
  session: SessionPayload | null | undefined,
  allowedRoles: readonly UserRole[]
): AuthorizationResult {
  if (!session) {
    return {
      authorized: false,
      status: 401,
      error: 'AuthenticationRequired: Session token missing or invalid.',
      requiredRoles: allowedRoles,
    };
  }

  if (!allowedRoles.includes(session.role)) {
    return {
      authorized: false,
      status: 403,
      error: `InsufficientPermissions: Role '${session.role}' is not authorized.`,
      requiredRoles: allowedRoles,
    };
  }

  return { authorized: true, status: 200 };
}

/**
 * Convenience guard requiring any staff role.
 */
export function authorizeStaff(session: SessionPayload | null | undefined): AuthorizationResult {
  return authorizeSessionRole(session, STAFF_ROLES);
}

/**
 * Convenience guard requiring owner role.
 */
export function authorizeOwner(session: SessionPayload | null | undefined): AuthorizationResult {
  return authorizeSessionRole(session, ['owner']);
}

/**
 * Extracts and decodes Cloudflare Access JWT Assertion header for staff perimeter security.
 */
export function extractCloudflareAccessIdentity(request: Request): { email?: string; aud?: string } | null {
  const jwt = request.headers.get('cf-access-jwt-assertion');
  if (!jwt) return null;

  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const payload = JSON.parse(atob(base64));
    return {
      email: payload.email,
      aud: Array.isArray(payload.aud) ? payload.aud[0] : payload.aud,
    };
  } catch {
    return null;
  }
}
