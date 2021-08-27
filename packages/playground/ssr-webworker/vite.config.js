/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  build: {
    minify: false
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
