// @ts-check
// this is automtically detected by scripts/jestPerTestSetup.ts and will replace
// the default e2e test serve behavior

const path = require('path')

const port = (exports.port = 9527)

/**
 * @param {string} root
 * @param {boolean} isProd
 */
exports.serve = async function serve(root, isProd) {
  if (isProd) {
    // build first
    const { build } = require('vite')
    // client build
    await build({
      root,
      logLevel: 'error',
      build: {
        target: 'esnext',
        minify: false,
        ssrManifest: true,
        outDir: 'dist/client'
      }
    })
    // server build
    await build({
      root,
      logLevel: 'error',
      build: {
        target: 'esnext',
        ssr: 'src/entry-server.js',
        outDir: 'dist/server'
      }
    })
  }

  const { createServer } = require(path.resolve(root, 'server.js'))
  const { app, vite } = await createServer(root, isProd)

  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(port, () => {
        resolve({
          // for test teardown
          close() {
            server.close()
            return vite && vite.close()
          }
        })
      })
    } catch (e) {
      reject(e)
    }
  })
}
