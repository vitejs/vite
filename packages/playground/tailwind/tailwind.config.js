module.exports = {
  mode: 'jit',
  purge: [
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
