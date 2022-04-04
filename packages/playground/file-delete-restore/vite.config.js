const react = require('@vitejs/plugin-react')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [react()],
  build: {
    // to make tests faster
    minify: false
  }
}
