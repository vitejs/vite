const vueJsx = require('@vitejs/plugin-vue-jsx')
const vite = require('vite')

module.exports = vite.defineConfig({
  base: '/es-sourcemap/',
  worker: {
    format: 'es',
    plugins: [vueJsx()]
  },
  build: {
    outDir: 'dist/es-sourcemap/',
    sourcemap: true
  }
})
