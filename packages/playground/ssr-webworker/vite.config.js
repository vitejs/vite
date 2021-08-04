/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  build: {
    minify: false
  },
  ssr: {
    target: 'webworker',
    bundleAll: true
  }
}
