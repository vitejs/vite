const { defineConfig } = require('vite')

module.exports = defineConfig({
  server: {
    host: 'localhost',
    headers: {
      'Cache-Control': 'no-store'
    }
  },
  build: {
    //speed up build
    minify: false,
    target: 'esnext'
  }
})
