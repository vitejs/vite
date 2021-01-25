// @ts-check
const vuePlugin = require('@vitejs/plugin-vue').default
const reactRefresh = require('@vitejs/plugin-react-refresh')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [vuePlugin(), reactRefresh()],
  build: {
    minify: false
  }
}
