const { defineConfig } = require('vite')

process.env.EXPAND = 'expand'

module.exports = defineConfig({
  base: '/env/',
  envPrefix: ['VITE_', 'CUSTOM_PREFIX_'],
  build: {
    outDir: 'dist/env',
  },
  define: {
    'import.meta.env.VITE_BOOL': true,
  },
})
