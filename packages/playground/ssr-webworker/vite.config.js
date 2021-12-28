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
    noExternal: true
  },
  plugins: [
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
