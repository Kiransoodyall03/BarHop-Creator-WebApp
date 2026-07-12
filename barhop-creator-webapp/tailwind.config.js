const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', ...defaultTheme.fontFamily.sans],
        display: ['"Bebas Neue"', 'cursive'],
      },
      colors: {
        surface: {
          deep: '#050505',
          DEFAULT: '#0f0f0f',
          card: '#15121c',
        },
        accent: {
          DEFAULT: '#f5a623',
          dim: '#e3a542',
        },
        neon: {
          violet: '#0072b9',
        },
      },
      boxShadow: {
        'glow-amber': '0 0 24px rgba(245, 166, 35, 0.25)',
        'glow-violet': '0 0 28px rgba(157, 107, 255, 0.30)',
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
