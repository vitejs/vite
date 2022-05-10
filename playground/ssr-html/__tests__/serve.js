// @ts-check
// this is automatically detected by scripts/vitestSetup.ts and will replace
// the default e2e test serve behavior

const path = require('path')
const { ports } = require('../../ports')

const port = (exports.port = ports['ssr-html'])

/**
 * @param {string} root
 * @param {boolean} isProd
 */
exports.serve = async function serve(root, isProd) {
  const { createServer } = require(path.resolve(root, 'server.js'))
  const { app, vite } = await createServer(root, isProd)

  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(port, () => {
        resolve({
          // for test teardown
          async close() {
            await new Promise((resolve) => {
              server.close(resolve)
            })
            if (vite) {
              await vite.close()
            }
          }
        })
      })
    } catch (e) {
      reject(e)
    }
  })
}
