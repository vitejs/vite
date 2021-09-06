// @ts-check
// this is automtically detected by scripts/jestPerTestSetup.ts and will replace
// the default e2e test serve behavior
const path = require('path')

const port = (exports.port = 9527)

/**
 * @param {string} root
 * @param {boolean} _isProd
 */
exports.serve = async function serve(root, _isProd) {
  const { build } = require('vite')
  await build({
    root,
    logLevel: 'silent',
    build: {
      target: 'esnext',
      ssr: 'entry-server.js',
      outDir: 'dist/server'
    }
  })

  const express = require('express')
  const app = express()

  app.use('/', async (_req, res) => {
    const { render } = require(path.resolve(
      root,
      './dist/server/entry-server.js'
    ))
    const html = await render()
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  })

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
