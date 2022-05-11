// this is automatically detected by scripts/vitestSetup.ts and will replace
// the default e2e test serve behavior

import path from 'path'
import http from 'http'
import sirv from 'sirv'
import { page, ports, serverLogs, setViteUrl, viteTestUrl } from '~utils'

export const port = ports.lib

export async function serve(root, isBuildTest) {
  setupConsoleWarnCollector()

  if (!isBuildTest) {
    const { createServer } = require('vite')
    process.env.VITE_INLINE = 'inline-serve'
    const viteServer = await (
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
    setViteUrl(`http://localhost:${viteServer.config.server.port}${base}`)
    await page.goto(viteTestUrl)

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
      logLevel: 'warn', // output esbuild warns
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

function setupConsoleWarnCollector() {
  const warn = console.warn
  console.warn = (...args) => {
    serverLogs.push(args.join(' '))
    return warn.call(console, ...args)
  }
}
