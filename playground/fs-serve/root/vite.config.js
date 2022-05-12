const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html')
      }
    }
  },
  server: {
    fs: {
      strict: true,
      allow: [path.resolve(__dirname, 'src')]
    },
    hmr: {
      overlay: false
    }
  },
  define: {
    ROOT: JSON.stringify(path.dirname(__dirname).replace(/\\/g, '/'))
  }
}
