/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
    './node_modules/flowbite/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        accent: '#00FF94',
        background: '#F5F5F0',
        'icon-bg': '#d4d4d4'
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
        display: ['Syne', 'sans-serif']
      }
    }
  },
  plugins: [
    require('flowbite/plugin')
  ]
}
