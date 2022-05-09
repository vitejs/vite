const react = require('@vitejs/plugin-react')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [react()],
  build: {
    minify: false
  }
}
