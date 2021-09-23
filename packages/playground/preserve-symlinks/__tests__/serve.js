// @ts-check
// this is automtically detected by scripts/jestPerTestSetup.ts and will replace
// the default e2e test serve behavior

const path = require('path')
const fs = require('fs-extra')

/**
 * @param {string} root
 */
exports.preServe = async (root) => {
  const testDist = path.resolve(root, './moduleA/dist')

  if (fs.existsSync(testDist)) {
    await fs.emptyDir(testDist)
  } else {
    fs.mkdirSync(testDist, { recursive: true })
  }

  fs.symlinkSync(
    path.resolve(testDist, '../src/index.js'),
    path.resolve(testDist, 'symlinks-moduleA.esm.js')
  )
}
