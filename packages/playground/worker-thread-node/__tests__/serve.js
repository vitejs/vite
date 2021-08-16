const { join } = require('path')
/**
 * @param {string} root
 * @param {boolean} isProd
 */
exports.serve = async function serve(root, isProd) {
  if (isProd) {
    const { build } = require('vite')
    await build({
      configFile: join(root, 'vite.config.ts'),
      root,
      logLevel: 'silent'
    })
  }

  return new Promise((resolve, _) => {
    resolve({
      close: async () => {
        // no need to close anything
      }
    })
  })
}
