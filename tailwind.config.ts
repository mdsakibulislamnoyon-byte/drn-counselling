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
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
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
