/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  resolve: {
    alias: {
      '@': __dirname
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: '@color: red;'
      }
    }
  },
  build: {
    sourcemap: true
  }
}
