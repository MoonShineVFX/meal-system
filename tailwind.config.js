/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

let dataPrefixes = {}
;['selected', 'loading', 'busy'].forEach((prefix) => {
  ;(dataPrefixes[prefix] = `ui~="${prefix}"`),
    (dataPrefixes[`not-${prefix}`] = `ui~="not-${prefix}"`)
})

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '576px',
      ...defaultTheme.screens,
    },
    data: dataPrefixes,
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
