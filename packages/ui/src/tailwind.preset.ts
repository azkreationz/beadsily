import { colors } from './tokens/colors';
import { typography } from './tokens/typography';
import { spacing } from './tokens/spacing';

/**
 * BeadsILY Tailwind CSS Theme Preset
 * Reusable configuration preset for apps/storefront and internal packages.
 */
export const beadsilyTailwindPreset = {
  theme: {
    extend: {
      colors: {
        charcoal: colors.charcoal,
        pink: colors.pink,
        raspberry: colors.raspberry,
        amber: colors.amber,
        cream: colors.cream,
        brand: {
          charcoal: colors.charcoal.DEFAULT,
          pink: colors.pink.DEFAULT,
          raspberry: colors.raspberry.DEFAULT,
          amber: colors.amber.DEFAULT,
          cream: colors.cream.DEFAULT,
          sand: colors.cream[300],
        },
      },
      fontFamily: {
        display: typography.fonts.display.split(', '),
        accent: typography.fonts.accent.split(', '),
        body: typography.fonts.body.split(', '),
        mono: typography.fonts.mono.split(', '),
      },
      fontSize: typography.fontSize,
      borderRadius: spacing.radii,
      boxShadow: spacing.shadows,
    },
  },
  plugins: [],
};

export default beadsilyTailwindPreset;
