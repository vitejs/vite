const vueJsx = require('@vitejs/plugin-vue-jsx')
const vite = require('vite')

module.exports = (sourcemap) =>
  vite.defineConfig({
    base: `/iife-${
      typeof sourcemap === 'boolean' ? 'sourcemap' : 'sourcemap-' + sourcemap
    }/`,
    worker: {
      format: 'iife',
      plugins: [vueJsx()]
    },
    build: {
      outDir: `dist/iife-${
        typeof sourcemap === 'boolean' ? 'sourcemap' : 'sourcemap-' + sourcemap
      }/`,
      sourcemap: sourcemap
    }
  })
