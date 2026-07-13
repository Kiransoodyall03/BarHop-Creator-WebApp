const defaultTheme = require('tailwindcss/defaultTheme');

// Semantic tokens resolve to CSS variables (RGB channels) defined in index.css,
// so every color flips automatically between light and dark via the `dark` class.
const t = (v) => `rgb(var(${v}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['"Space Grotesk"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        surface: {
          DEFAULT: t('--color-surface'),
          raised: t('--color-surface-raised'),
          overlay: t('--color-surface-overlay'),
        },
        content: {
          DEFAULT: t('--color-content'),
          muted: t('--color-content-muted'),
          faint: t('--color-content-faint'),
        },
        edge: {
          DEFAULT: t('--color-edge'),
          strong: t('--color-edge-strong'),
        },
        primary: {
          DEFAULT: t('--color-primary'),
          hover: t('--color-primary-hover'),
        },
        'on-primary': t('--color-on-primary'),
        secondary: { DEFAULT: t('--color-secondary') },
        'on-secondary': t('--color-on-secondary'),
        success: t('--color-success'),
        danger: t('--color-danger'),
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'glow-primary': '0 0 24px rgb(255 77 109 / 0.35)',
        'glow-gold': '0 0 24px rgb(255 184 77 / 0.30)',
      },
      keyframes: {
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        // Registration wizard step transitions (fwd = next, back = prev)
        'step-fwd': {
          from: { opacity: '0', transform: 'translateX(40px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'step-back': {
          from: { opacity: '0', transform: 'translateX(-40px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.25s ease-out',
        'step-fwd': 'step-fwd 0.3s ease-out',
        'step-back': 'step-back 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
