import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
import { Z_INDEX } from './src/constants/z-index';
import { BREAKPOINTS } from './src/constants/breakpoints';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter Variable"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        lattice: {
          line: '#e5e7eb',
          'line-hover': '#9ca3af',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f9fafb',
        },
      },
      boxShadow: {
        node: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'node-hover': '0 2px 6px 0 rgba(0, 0, 0, 0.08)',
        'node-selected': '0 2px 8px 0 rgba(99, 102, 241, 0.12)',
        panel: '0 4px 12px 0 rgba(0, 0, 0, 0.06)',
      },
      screens: Object.fromEntries(
        Object.entries(BREAKPOINTS).map(([key, value]) => [key, `${value}px`]),
      ),
      zIndex: Object.fromEntries(
        Object.entries(Z_INDEX).map(([key, value]) => [key.toLowerCase(), String(value)]),
      ),
      spacing: {
        sidebar: '280px',
        'header-sm': '56px',
        header: '64px',
        'safe-top': 'var(--safe-area-top)',
        'safe-bottom': 'var(--safe-area-bottom)',
        'safe-left': 'var(--safe-area-left)',
        'safe-right': 'var(--safe-area-right)',
      },
      height: {
        screen: '100dvh',
      },
      minHeight: {
        loader: '400px',
        screen: '100dvh',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
