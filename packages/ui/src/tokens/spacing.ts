/**
 * BeadsILY Design Tokens: Spacing, Radii, Shadows & Elevation
 * Designed for tactile, playful yet mature DTC packaging & mobile-first touch UI.
 */

export const spacing = {
  // Border Radius Scale (Curved bead-inspired corners with sophisticated restraint)
  radii: {
    none: '0px',
    xs: '4px',
    sm: '8px',
    md: '12px',    // Standard card & button radius
    lg: '16px',    // Modals & featured cards
    xl: '24px',    // Hero containers & party kit selectors
    '2xl': '32px',
    full: '9999px',// Pill badges & bead-shaped indicators
  },

  // Shadows (Soft, warm craft-inspired diffusion using brand charcoal tint)
  shadows: {
    xs: '0 1px 2px 0 rgba(23, 20, 22, 0.05)',
    sm: '0 2px 4px -1px rgba(23, 20, 22, 0.06), 0 1px 2px -1px rgba(23, 20, 22, 0.04)',
    md: '0 4px 8px -2px rgba(23, 20, 22, 0.08), 0 2px 4px -2px rgba(23, 20, 22, 0.04)',
    lg: '0 10px 16px -3px rgba(23, 20, 22, 0.08), 0 4px 6px -4px rgba(23, 20, 22, 0.03)',
    xl: '0 20px 25px -5px rgba(23, 20, 22, 0.1), 0 8px 10px -6px rgba(23, 20, 22, 0.04)',
    card: '0 4px 20px rgba(23, 20, 22, 0.06)',
    glowPink: '0 0 24px rgba(255, 104, 157, 0.35)',
    glowAmber: '0 0 20px rgba(255, 193, 7, 0.3)',
  },

  // Packaging & Box Dimensions (Standard Physical Packout Requirements for Pam & Operations)
  packaging: {
    partyKit15MasterBox: {
      name: '15-Guest Party Kit Master Shipper',
      lengthInches: 14,
      widthInches: 10,
      heightInches: 4,
      material: 'Rigid White Corrugated ECT-32 with Pearl Cream Linen Finish',
      closure: 'Interlocking Roll-End Tuck Front (RETF) with Tamper-Evident Branded Sticker',
    },
    mysteryMakerBox: {
      name: 'Mystery Maker Single Box (1 Pen, 1 Bracelet, 1 Keychain = 3 Projects)',
      lengthInches: 7,
      widthInches: 5,
      heightInches: 2,
      material: 'Custom Printed Tuck-Top Kraft/Cream Carton with Foil Accent',
      closure: 'Sealed with tamper-evident serial-numbered holographic sticker',
    },
    bestieDuoBox: {
      name: 'Bestie Mystery Duo Box (2 Sets of 3 Projects = 6 Projects)',
      lengthInches: 9,
      widthInches: 6,
      heightInches: 2.5,
      material: 'Custom Printed Rigid Two-Piece Setup Box with Compartment Divider',
      closure: 'Shrink-wrapped or custom band',
    },
    hostInstructionCard: {
      name: 'Host Instruction & Recipe Folio (KIT-01)',
      widthInches: 8.5,
      heightInches: 11,
      folds: 'Tri-fold or 4-panel accordion',
      stock: '100lb Silk Cover with Soft-Touch Matte Coating (Spill-resistant)',
      qrPosition: 'Back cover lower-right: 1.5 x 1.5 in high-contrast QR code to online video guide',
    },
    canopyBanner: {
      name: 'BeadsILY School Booth Canopy Banner (October 23)',
      widthFt: 8,
      heightFt: 2,
      grommets: 'Every 24 inches along perimeter, reinforced corners',
      material: '13oz Heavy-Duty Matte Vinyl with UV Weatherproof Inks',
    }
  }
} as const;

export type BrandSpacing = typeof spacing;
