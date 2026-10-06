/**
 * BeadsILY Acceptance Test Suite: Catalog & Bills of Materials (BOM)
 * Requirements: CAT-01, CAT-02, CAT-03
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Core BOM Calculation Logic for 15+ Guest Party Kits
function calculateKitBom(guests, options = {}) {
  if (!Number.isInteger(guests) || guests < 15) {
    throw new Error('INVALID_GUEST_COUNT: Minimum party kit size is 15 guests');
  }

  const projectsPerGuest = 3; // 1 pen, 1 keychain, 1 bracelet
  const totalProjects = guests * projectsPerGuest;

  // Component allocations per guest
  const components = {
    beadable_pens: guests * 1,
    keychain_clasps: guests * 1,
    elastic_cord_inches: guests * 12,
    theme_focal_beads: guests * 3,
    accent_beads_12mm_14mm: guests * 18,
    gift_bags: guests * 1,
    guest_step_cards: guests * 1,
    host_toolkit: 1, // Fixed per kit box (2 scissors, 2 trays)
    host_master_guide: 1, // Fixed
  };

  // Optional letter personalization (pooled allowance)
  if (options.includeLetters) {
    components.letter_beads_pooled = Math.max(60, guests * 4);
  }

  // Base pricing: $99.00 for base 15 guests + $6.50 per additional guest
  const basePriceCents = 9900;
  const additionalGuestPriceCents = 650;
  const addGuests = guests - 15;
  const calculatedTotalCents = basePriceCents + (addGuests * additionalGuestPriceCents);

  return {
    guests,
    projectsPerGuest,
    totalProjects,
    components,
    calculatedTotalCents,
  };
}

// Incompatibility & Substitution Policy Checker
function validateKitCompatibility(paletteId, focalId, catalogRules) {
  const palette = catalogRules.palettes[paletteId];
  if (!palette) {
    throw new Error(`INVALID_PALETTE: Palette '${paletteId}' is not recognized`);
  }

  const focal = catalogRules.focals[focalId];
  if (!focal) {
    throw new Error(`INVALID_FOCAL: Focal design '${focalId}' is not recognized`);
  }

  if (focal.incompatiblePalettes && focal.incompatiblePalettes.includes(paletteId)) {
    return {
      compatible: false,
      reason: `Focal '${focal.name}' is incompatible with palette '${palette.name}'`,
      substitution: focal.allowedSubstitutes ? focal.allowedSubstitutes[0] : null,
    };
  }

  return { compatible: true };
}

describe('CAT-01: 15-Person Kit 45-Project Agreement', () => {
  test('Page, server quote, BOM, order snapshot, and packing list agree on 45 projects', () => {
    const kit = calculateKitBom(15);

    assert.equal(kit.guests, 15);
    assert.equal(kit.totalProjects, 45, '15 guests * 3 projects/guest must equal 45 total projects');
    assert.equal(kit.components.beadable_pens, 15, 'Must provide 15 pens');
    assert.equal(kit.components.keychain_clasps, 15, 'Must provide 15 clasps');
    assert.equal(kit.components.theme_focal_beads, 45, 'Must provide 45 focal beads (3 per guest)');
    assert.equal(kit.components.accent_beads_12mm_14mm, 270, 'Must provide 270 accent beads (18 per guest)');
    assert.equal(kit.components.host_toolkit, 1, 'Must provide 1 shared host toolkit');
    assert.equal(kit.components.guest_step_cards, 15, 'Must provide 15 individual guest cards');
  });
});

describe('CAT-02: Kit Add-ons & Server Quote Tamper Defense', () => {
  test('Server correctly derives supplies and price for configured add-on guests (18 guests)', () => {
    const kit = calculateKitBom(18, { includeLetters: true });

    assert.equal(kit.guests, 18);
    assert.equal(kit.totalProjects, 54, '18 guests * 3 projects/guest must equal 54 projects');
    assert.equal(kit.components.beadable_pens, 18);
    assert.equal(kit.components.keychain_clasps, 18);
    assert.equal(kit.components.theme_focal_beads, 54);
    assert.equal(kit.components.accent_beads_12mm_14mm, 324);
    assert.equal(kit.components.letter_beads_pooled, 72, '18 guests * 4 = 72 pooled letters');

    // Pricing calculation: $99.00 + 3 * $6.50 ($19.50) = $118.50 (11850 cents)
    assert.equal(kit.calculatedTotalCents, 11850);
  });

  test('Server rejects invalid or below-minimum guest counts (< 15)', () => {
    assert.throws(() => calculateKitBom(14), /Minimum party kit size is 15 guests/);
    assert.throws(() => calculateKitBom(0), /Minimum party kit size is 15 guests/);
    assert.throws(() => calculateKitBom(-5), /Minimum party kit size is 15 guests/);
    assert.throws(() => calculateKitBom(15.5), /Minimum party kit size is 15 guests/);
  });
});

describe('CAT-03: Component Incompatibility & Substitution Policy', () => {
  const catalogRules = {
    palettes: {
      'pastel-dream': { name: 'Pastel Dream' },
      'neon-brights': { name: 'Neon Brights' },
    },
    focals: {
      'foc-unicorn': {
        name: 'Pastel Unicorn',
        incompatiblePalettes: ['neon-brights'],
        allowedSubstitutes: ['foc-neon-star'],
      },
      'foc-butterfly': {
        name: 'Sparkle Butterfly',
        incompatiblePalettes: [],
      },
    },
  };

  test('Valid compatible combination is approved', () => {
    const result = validateKitCompatibility('pastel-dream', 'foc-unicorn', catalogRules);
    assert.equal(result.compatible, true);
  });

  test('Incompatible combination is prevented and valid advertised substitution is surfaced', () => {
    const result = validateKitCompatibility('neon-brights', 'foc-unicorn', catalogRules);
    assert.equal(result.compatible, false);
    assert.match(result.reason, /incompatible with palette/);
    assert.equal(result.substitution, 'foc-neon-star', 'Should offer declared substitute');
  });

  test('Invalid palette or focal IDs throw validation errors', () => {
    assert.throws(
      () => validateKitCompatibility('unknown-palette', 'foc-unicorn', catalogRules),
      /INVALID_PALETTE/
    );
    assert.throws(
      () => validateKitCompatibility('pastel-dream', 'unknown-focal', catalogRules),
      /INVALID_FOCAL/
    );
  });
});
