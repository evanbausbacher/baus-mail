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
        // iOS-native palette: systemGroupedBackground + systemBlue
        background: '#F2F2F7',
        surface: '#FFFFFF',
        canvas: '#F2F2F7',
        accent: {
          DEFAULT: '#007AFF',
          hover: '#0062CC',
        },
        ink: {
          DEFAULT: '#0F172A',
          muted: '#475569',
          subtle: '#8E8E93',
        },
        line: '#E5E5EA',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        ios: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)',
        fab: '0 10px 25px rgba(0, 122, 255, 0.28), 0 4px 10px rgba(15, 23, 42, 0.10)',
        sheet: '0 -8px 30px rgba(15, 23, 42, 0.12)',
      },
      transitionTimingFunction: {
        ios: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
