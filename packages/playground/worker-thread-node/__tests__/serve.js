const { join } = require('path')
/**
 * @param {string} root
 * @param {boolean} isProd
 */
exports.serve = async function serve(root, isProd) {
  // make a build in either cases
  // make minified build if prod
  if (isProd) {
    const { build } = require('vite')
    await build({
      configFile: join(root, 'vite.config.ts'),
      root,
      logLevel: 'silent'
    })
  } else {
    const { build } = require('vite')

    const config = require(join(root, 'vite.config.ts')).serveConfig
    await build({
      ...config,
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
