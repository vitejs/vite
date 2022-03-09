const legacy = require('@vitejs/plugin-legacy').default
const vite = require('vite')

module.exports = vite.defineConfig({
  plugins: [legacy()],
  build: {
    target: 'chrome60'
  },
  worker: {
    format: 'es'
  }
})
