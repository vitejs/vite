const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    //speed up build
    minify: false,
    target: 'esnext',
    assetsInlineLimit: 0,
    manifest: true,
  },
})
