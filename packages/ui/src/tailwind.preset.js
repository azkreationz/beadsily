import { colors } from './tokens/colors.js';
import { typography } from './tokens/typography.js';
import { spacing } from './tokens/spacing.js';

/**
 * BeadsILY Tailwind CSS Theme Preset (JavaScript)
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
