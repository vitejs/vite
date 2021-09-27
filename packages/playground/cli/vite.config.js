const { defineConfig } = require('vite')

module.exports = defineConfig({
  server: {
    host: 'localhost'
  },
  build: {
    //speed up build
    minify: false,
    target: 'esnext'
  }
})
