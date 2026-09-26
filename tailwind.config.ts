import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e8f4fd',
          100: '#bee3f8',
          500: '#1a7abf',
          600: '#1565a8',
          700: '#114f8a',
          800: '#0d3d6e',
          900: '#092c52',
        },
      },
    },
  },
  plugins: [],
};
export default config;
