import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary, #3b82f6)',
        success: 'var(--color-success, #10b981)',
        warning: 'var(--color-warning, #f59e0b)',
        danger: 'var(--color-danger, #ef4444)',
      },
    },
  },
  plugins: [],
};

export default config;
