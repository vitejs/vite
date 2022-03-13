const MagicString = require('magic-string')

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
      },
      styl: {
        additionalData: (content, filename) => {
          const ms = new MagicString(content, { filename })

          const willBeReplaced = 'blue-red-mixed'
          const start = content.indexOf(willBeReplaced)
          ms.overwrite(start, start + willBeReplaced.length, 'purple')

          const map = ms.generateMap({ hires: true })
          map.file = filename
          map.sources = [filename]

          return {
            content: ms.toString(),
            map
          }
        }
      }
    }
  },
  build: {
    sourcemap: true
  }
}
