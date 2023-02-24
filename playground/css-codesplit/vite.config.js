const { resolve } = require('node:path')

module.exports = {
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, './index.html'),
        other: resolve(__dirname, './other.js'),
      },
      output: {
        manualChunks(id) {
          // make `chunk.css` it's own chunk for easier testing of pure css chunks
          if (id.includes('chunk.css')) {
            return 'chunk'
          }
        },
      },
    },
  },
}
