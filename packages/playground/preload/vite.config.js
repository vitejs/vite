const vuePlugin = require('@vitejs/plugin-vue')

module.exports = {
  plugins: [vuePlugin()],
  build: {
    minify: 'terser',
    terserOptions: {
      format: {
        beautify: true
      },
      compress: {
        passes: 3
      }
    }
  }
}
