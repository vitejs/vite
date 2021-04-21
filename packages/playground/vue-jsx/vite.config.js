const vueJsxPlugin = require('@vitejs/plugin-vue-jsx')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [
    vueJsxPlugin({
      include: [/\.tesx$/, /\.[jt]sx$/]
    })
  ],
  build: {
    // to make tests faster
    minify: false
  },
  server: {
    host: '0.0.0.0'
  }
}
