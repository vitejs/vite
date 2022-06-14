module.exports = {
  mode: 'jit',
  purge: [
    // Before editing this section, make sure no paths are matching with `/src/App.vue`
    // Look https://github.com/vitejs/vite/pull/6959 for more details
    __dirname + '/src/{components,views}/**/*.vue',
    __dirname + '/src/App.vue'
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {}
  },
  variants: {
    extend: {}
  },
  plugins: []
}
