const vuePlugin = require('@vitejs/plugin-vue')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [vuePlugin()],
  build: {
    minify: false
  }
}
