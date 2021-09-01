const vueJsxPlugin = require('@vitejs/plugin-vue-jsx')
const vuePlugin = require('@vitejs/plugin-vue')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [
    vueJsxPlugin({
      include: [/\.tesx$/, /\.[jt]sx$/]
    }),
    vuePlugin()
  ],
  build: {
    // to make tests faster
    minify: false
  }
}
