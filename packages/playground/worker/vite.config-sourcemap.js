const vueJsx = require('@vitejs/plugin-vue-jsx')
const vite = require('vite')

module.exports = vite.defineConfig((sourcemap) => {
  sourcemap = process.env.WORKER_MODE || sourcemap
  if (sourcemap === 'sourcemap') {
    sourcemap = true
  }
  return {
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
  }
})
