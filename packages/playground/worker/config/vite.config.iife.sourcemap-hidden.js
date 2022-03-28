const vueJsx = require('@vitejs/plugin-vue-jsx')
const vite = require('vite')

module.exports = vite.defineConfig({
  base: '/iife-sourcemap-hidden/',
  worker: {
    format: 'iife',
    plugins: [vueJsx()]
  },
  build: {
    outDir: 'dist/iife-sourcemap-hidden',
    sourcemap: 'hidden'
  }
})
