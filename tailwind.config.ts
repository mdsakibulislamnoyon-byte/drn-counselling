import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f7f6',
          100: '#dcebe8',
          200: '#b8d6d0',
          300: '#8fbcb3',
          400: '#5f9a8f',
          500: '#3f7d72',
          600: '#31655c',
          700: '#28524b',
          800: '#22423d',
          900: '#1c3733',
        },
        ink: {
          50: '#f6f7f8',
          100: '#eceef0',
          700: '#3a4148',
          800: '#282e33',
          900: '#181c1f',
          deep: '#082e33',
        },
        paper: {
          DEFAULT: '#f9f8f3',
          deep: '#f0eee5',
        },
        cream: '#faf4e8',
        mint: {
          DEFAULT: '#b9dfd4',
          deep: '#529d93',
        },
        coral: {
          DEFAULT: '#f3a28f',
          deep: '#bd6758',
        },
        accent: {
          blue: '#a9c7db',
          'blue-deep': '#5589a9',
          yellow: '#f2d783',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        mono: ['var(--font-dm-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
