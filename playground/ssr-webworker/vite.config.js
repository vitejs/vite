/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  build: {
    minify: false
  },
  resolve: {
    dedupe: ['react']
  },
  ssr: {
    target: 'webworker',
    noExternal: ['this-should-be-replaced-by-the-boolean']
  },
  plugins: [
    {
      config() {
        return {
          ssr: {
            noExternal: true
          }
        }
      }
    },
    {
      config() {
        return {
          ssr: {
            noExternal: ['this-should-not-replace-the-boolean']
          }
        }
      }
    }
  ]
}
