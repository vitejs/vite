// @ts-check
// this is automtically detected by scripts/jestPerTestSetup.ts and will replace
// the default e2e test serve behavior

const path = require('path')

const port = (exports.port = 9528)

/**
 * @param {string} root
 * @param {boolean} isProd
 */
exports.serve = async function serve(root, isProd) {
  // we build first, regardless of whether it's prod/build mode
  // because Vite doesn't support the concept of a "webworker server"
  const { build } = require('vite')

  // worker build
  await build({
    root,
    logLevel: 'silent',
    build: {
      target: 'esnext',
      ssr: 'src/entry-worker.jsx',
      outDir: 'dist/worker'
    }
  })

  const { createServer } = require(path.resolve(root, 'worker.js'))
  const { app } = await createServer(root, isProd)

  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(port, () => {
        resolve({
          // for test teardown
          async close() {
            await new Promise((resolve) => {
              server.close(resolve)
            })
          }
        })
      })
    } catch (e) {
      reject(e)
    }
  })
}
