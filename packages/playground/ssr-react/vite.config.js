const pluginReact = require('@vitejs/plugin-react')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [pluginReact()],
  build: {
    minify: false
  }
}
