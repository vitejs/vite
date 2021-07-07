const vuePlugin = require('@vitejs/plugin-vue')

module.exports = {
  plugins: [vuePlugin()],
  build: {
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
