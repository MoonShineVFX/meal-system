/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    data: {
      active: 'ui~="active"',
      main: 'ui~="main"',
      loading: 'ui~="loading"',
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
}
