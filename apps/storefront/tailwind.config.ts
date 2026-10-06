import type { Config } from 'tailwindcss';
import { beadsilyTailwindPreset } from '../../packages/ui/src/tailwind.preset';

const config: Config = {
  presets: [beadsilyTailwindPreset as any],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
