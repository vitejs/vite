const vuePlugin = require('@vitejs/plugin-vue')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  css: {
    preprocessorOptions: {
      less: {
        additionalData: '@color: red;'
      }
    }
  },
  plugins: [vuePlugin()],
  build: {
    sourcemap: true
  }
}
