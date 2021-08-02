// @ts-check
// this is automtically detected by scripts/jestPerTestSetup.ts and will replace
// the default e2e test serve behavior

const path = require('path')
const http = require('http')
const sirv = require('sirv')

const port = (exports.port = 9527)

/**
 * @param {string} root
 * @param {boolean} isBuildTest
 */
exports.serve = async function serve(root, isBuildTest) {
  // build first

  if (!isBuildTest) {
    const { createServer } = require('vite')
    process.env.VITE_INLINE = 'inline-serve'
    let viteServer = await (
      await createServer({
        root: root,
        logLevel: 'silent',
        server: {
          watch: {
            usePolling: true,
            interval: 100
          },
          host: true,
          fs: {
            strict: !isBuildTest
          }
        },
        build: {
          target: 'esnext'
        }
      })
    ).listen()
    // use resolved port/base from server
    const base = viteServer.config.base === '/' ? '' : viteServer.config.base
    const url =
      (global.viteTestUrl = `http://localhost:${viteServer.config.server.port}${base}`)
    await page.goto(url)

    return viteServer
  } else {
    const { build } = require('vite')
    await build({
      root,
      logLevel: 'silent',
      configFile: path.resolve(__dirname, '../vite.config.js')
    })

    await build({
      root,
      logLevel: 'silent',
      configFile: path.resolve(__dirname, '../vite.dyimport.config.js')
    })

    // start static file server
    const serve = sirv(path.resolve(root, 'dist'))
    const httpServer = http.createServer((req, res) => {
      if (req.url === '/ping') {
        res.statusCode = 200
        res.end('pong')
      } else {
        serve(req, res)
      }
    })

    return new Promise((resolve, reject) => {
      try {
        const server = httpServer.listen(port, async () => {
          await page.goto(`http://localhost:${port}`)
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
}
