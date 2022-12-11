/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme')
const plugin = require('tailwindcss/plugin')

const skeletonPlugin = plugin(({ addComponents, theme }) => {
  addComponents({
    '.skeleton': {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: theme('colors.stone.200'),
    },
    '.skeleton::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      transform: 'translateX(-100%)',
      backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0) 10%, rgba(255, 255, 255, 0.7) 60%, rgba(255, 255, 255, 0) 100%)`,
      animation: 'skeleton 1.5s infinite',
    },
    '@keyframes skeleton': {
      '100%': {
        transform: 'translateX(100%)',
      },
    },
  })
})

const dataPrefixes = ['selected', 'loading', 'busy', 'available'].reduce(
  (acc, prefix) => {
    acc[prefix] = `ui~="${prefix}"`
    acc[`not-${prefix}`] = `ui~="not-${prefix}"`
    return acc
  },
  {},
)

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    data: dataPrefixes,
  },
  plugins: [
    require('@headlessui/tailwindcss'),
    require('@tailwindcss/container-queries'),
    skeletonPlugin,
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
}
