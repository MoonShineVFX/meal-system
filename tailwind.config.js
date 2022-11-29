/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '576px',
      ...defaultTheme.screens,
    },
    data: {
      selected: 'ui~="selected"',
      'not-selected': 'ui~="not-selected"',
      loading: 'ui~="loading"',
      'not-loading': 'ui~="not-loading"',
    },
    extend: {
      keyframes: {
        blink: {
          '0%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
      },
      animation: {
        blink: 'blink 1s cubic-bezier(1, 0, 0, 1) infinite',
      },
      screens: {
        tall: { raw: '(min-height: 580px)' },
      },
    },
  },
  plugins: [require('@headlessui/tailwindcss')],
  future: {
    hoverOnlyWhenSupported: true,
  },
}
