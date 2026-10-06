import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRbacPermission } from './lib/security-modules.mjs';

test('RBAC: Anonymous user permissions', () => {
  // Can browse catalog
  assert.equal(checkRbacPermission('anonymous', 'browse_catalog').allowed, true);
  // Can initiate cart reservation (with Turnstile)
  assert.equal(checkRbacPermission('anonymous', 'create_cart_reservation').allowed, true);
  // CANNOT view packing lists
  assert.equal(checkRbacPermission('anonymous', 'view_packing_lists').allowed, false);
  // CANNOT issue refunds
  assert.equal(checkRbacPermission('anonymous', 'issue_refund').allowed, false);
  // CANNOT modify catalog pricing
  assert.equal(checkRbacPermission('anonymous', 'modify_catalog_pricing').allowed, false);
});

test('RBAC: Customer permissions', () => {
  // Can view own order and manage own subscription
  assert.equal(checkRbacPermission('customer', 'view_own_order').allowed, true);
  assert.equal(checkRbacPermission('customer', 'manage_own_subscription').allowed, true);
  // CANNOT access warehouse packing lists
  assert.equal(checkRbacPermission('customer', 'view_packing_lists').allowed, false);
  // CANNOT mark orders shipped
  assert.equal(checkRbacPermission('customer', 'mark_order_shipped').allowed, false);
  // CANNOT view inventory movement ledger
  assert.equal(checkRbacPermission('customer', 'view_movement_ledger').allowed, false);
});

test('RBAC: Warehouse Packer permissions (Least Privilege)', () => {
  // CAN view packing lists and mark orders shipped
  assert.equal(checkRbacPermission('packer', 'view_packing_lists').allowed, true);
  assert.equal(checkRbacPermission('packer', 'mark_order_shipped').allowed, true);
  assert.equal(checkRbacPermission('packer', 'record_component_intake').allowed, true);
  // CANNOT issue refunds (financial action)
  const refundCheck = checkRbacPermission('packer', 'issue_refund');
  assert.equal(refundCheck.allowed, false);
  assert.match(refundCheck.reason, /not permitted/);
  // CANNOT modify BOM recipes or master catalog pricing
  assert.equal(checkRbacPermission('packer', 'modify_catalog_pricing').allowed, false);
  assert.equal(checkRbacPermission('packer', 'modify_bom_recipes').allowed, false);
  // CANNOT view financial metrics
  assert.equal(checkRbacPermission('packer', 'view_financial_metrics').allowed, false);
});

test('RBAC: Customer Support permissions', () => {
  // CAN view packing lists, update shipping address, and issue capped refunds
  assert.equal(checkRbacPermission('support', 'view_packing_lists').allowed, true);
  assert.equal(checkRbacPermission('support', 'update_shipping_address').allowed, true);
  assert.equal(checkRbacPermission('support', 'issue_refund').allowed, true);
  // CANNOT modify master catalog pricing or BOM recipes
  assert.equal(checkRbacPermission('support', 'modify_catalog_pricing').allowed, false);
  assert.equal(checkRbacPermission('support', 'modify_bom_recipes').allowed, false);
  // CANNOT manage staff accounts
  assert.equal(checkRbacPermission('support', 'manage_staff_accounts').allowed, false);
});

test('RBAC: Independent Auditor permissions', () => {
  // CAN view movement ledger and packing lists for audit verification
  assert.equal(checkRbacPermission('auditor', 'view_movement_ledger').allowed, true);
  assert.equal(checkRbacPermission('auditor', 'view_packing_lists').allowed, true);
  // CANNOT mutate any operational state
  assert.equal(checkRbacPermission('auditor', 'mark_order_shipped').allowed, false);
  assert.equal(checkRbacPermission('auditor', 'issue_refund').allowed, false);
  assert.equal(checkRbacPermission('auditor', 'record_component_intake').allowed, false);
  assert.equal(checkRbacPermission('auditor', 'modify_catalog_pricing').allowed, false);
});

test('RBAC: Owner full administrative authority', () => {
  // Owner has permission across all system actions
  const actions = [
    'browse_catalog',
    'create_cart_reservation',
    'view_packing_lists',
    'mark_order_shipped',
    'record_component_intake',
    'update_shipping_address',
    'issue_refund',
    'modify_catalog_pricing',
    'modify_bom_recipes',
    'view_movement_ledger',
    'view_financial_metrics',
    'manage_staff_accounts',
  ];

  for (const action of actions) {
    const res = checkRbacPermission('owner', action);
    assert.equal(res.allowed, true, `Owner should have permission for: ${action}`);
  }
});

test('RBAC: Invalid role or action handling', () => {
  assert.equal(checkRbacPermission('hacker', 'browse_catalog').allowed, false);
  assert.equal(checkRbacPermission(null, 'browse_catalog').allowed, false);
  assert.equal(checkRbacPermission('owner', 'drop_database').allowed, false);
});
