const { resolve } = require('node:path')

module.exports = {
  build: {
    outDir: './dist',
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, './index.html'),
        other: resolve(__dirname, './other.js'),
      },
      treeshake: false,
      output: {
        format: 'cjs',
        freeze: false,
        externalLiveBindings: false,
      },
    },
  },
}
