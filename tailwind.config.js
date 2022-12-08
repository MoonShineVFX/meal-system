/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme')

let dataPrefixes = {}
;['selected', 'loading', 'busy'].forEach((prefix) => {
  ;(dataPrefixes[prefix] = `ui~="${prefix}"`),
    (dataPrefixes[`not-${prefix}`] = `ui~="not-${prefix}"`)
})

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    data: dataPrefixes,
  },
  plugins: [
    require('@headlessui/tailwindcss'),
    require('@tailwindcss/container-queries'),
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
}
