// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior

import path from 'node:path'
import http from 'node:http'
import sirv from 'sirv'
import {
  isBuild,
  page,
  ports,
  rootDir,
  serverLogs,
  setViteUrl,
  viteTestUrl,
} from '~utils'

export const port = ports.lib

export async function serve(): Promise<{ close(): Promise<void> }> {
  setupConsoleWarnCollector()

  if (!isBuild) {
    const { createServer } = await import('vite')
    process.env.VITE_INLINE = 'inline-serve'
    const viteServer = await (
      await createServer({
        root: rootDir,
        logLevel: 'silent',
        server: {
          watch: {
            usePolling: true,
            interval: 100,
          },
          host: true,
          fs: {
            strict: !isBuild,
          },
        },
        build: {
          target: 'esnext',
        },
      })
    ).listen()
    // use resolved port/base from server
    const devBase = viteServer.config.base === '/' ? '' : viteServer.config.base
    setViteUrl(`http://localhost:${viteServer.config.server.port}${devBase}`)
    await page.goto(viteTestUrl)

    return viteServer
  } else {
    const { build } = await import('vite')
    await build({
      root: rootDir,
      logLevel: 'silent',
      configFile: path.resolve(__dirname, '../vite.config.js'),
    })

    await build({
      root: rootDir,
      logLevel: 'warn', // output esbuild warns
      configFile: path.resolve(__dirname, '../vite.dyimport.config.js'),
    })

    await build({
      root: rootDir,
      logLevel: 'warn', // output esbuild warns
      configFile: path.resolve(__dirname, '../vite.nominify.config.js'),
    })

    await build({
      root: rootDir,
      logLevel: 'warn', // output esbuild warns
      configFile: path.resolve(
        __dirname,
        '../vite.helpers-injection.config.js',
      ),
    })

    // start static file server
    const serve = sirv(path.resolve(rootDir, 'dist'))
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
            },
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
