const react = require('@vitejs/plugin-react')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [react()],
  build: {
    minify: false,
    manualChunks: (config) => {
      return (id) => {
        if (id.includes('Home.jsx')) {
          return 'Home.chunk'
        }
      }
    }
  }
}
