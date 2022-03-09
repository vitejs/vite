// @ts-check
// this is automtically detected by scripts/jestPerTestSetup.ts and will replace
// the default e2e test serve behavior
const path = require('path')
const config = require('../../vite.config-worker')
const port = (exports.port = 1065)

/**
 * @param {string} root
 * @param {boolean} _isProd
 */
exports.serve = async function serve(root, _isProd) {
  const { createServer } = require('vite')
  const devServer = await createServer({
    ...config,
    root
  })

  return new Promise((resolve, reject) => {
    try {
      await devServer.listen(port)
      resolve({
        // for test teardown
        async close() {
          await new Promise((resolve) => {
            devServer.close(resolve)
          })
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}
