// @ts-check
// this is automtically detected by scripts/jestPerTestSetup.ts and will replace
// the default e2e test serve behavior

const path = require('path')

/**
 * @param {string} root
 * @param {boolean} isBuildTest
 */
exports.serve = async function serve(root, isBuildTest) {
  // build vue component lib
  const { build } = require('vite')
  await build({
    root,
    logLevel: 'silent',
    configFile: path.resolve(__dirname, '../vite.config.lib.ts')
  })
}
