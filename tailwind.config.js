/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '512px',
      ...defaultTheme.screens,
    },
    data: {
      active: 'ui~="active"',
      'not-active': 'ui~="not-active"',
      main: 'ui~="main"',
      'not-main': 'ui~="not-main"',
      loading: 'ui~="loading"',
    },
  },
  plugins: [require('@headlessui/tailwindcss')],
  future: {
    hoverOnlyWhenSupported: true,
  },
}
