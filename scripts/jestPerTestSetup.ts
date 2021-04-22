import fs from 'fs-extra'
import * as http from 'http'
import { resolve, dirname } from 'path'
import slash from 'slash'
import sirv from 'sirv'
import { createServer, build, ViteDevServer, UserConfig } from 'vite'
import { Page } from 'playwright-chromium'

const isBuildTest = !!process.env.VITE_TEST_BUILD

// injected by the test env
declare global {
  namespace NodeJS {
    interface Global {
      page?: Page
      viteTestUrl?: string
    }
  }
}

let server: ViteDevServer | http.Server
let tempDir: string
let err: Error

const logs = ((global as any).browserLogs = [])
const onConsole = (msg) => {
  logs.push(msg.text())
}

beforeAll(async () => {
  const page = global.page
  if (!page) {
    return
  }
  try {
    page.on('console', onConsole)

    const testPath = expect.getState().testPath
    const testName = slash(testPath).match(/playground\/([\w-]+)\//)?.[1]

    // if this is a test placed under playground/xxx/__tests__
    // start a vite server in that directory.
    if (testName) {
      const playgroundRoot = resolve(__dirname, '../packages/playground')
      const srcDir = resolve(playgroundRoot, testName)
      tempDir = resolve(__dirname, '../temp', testName)
      await fs.copy(srcDir, tempDir, {
        dereference: true,
        filter(file) {
          file = slash(file)
          return (
            !file.includes('__tests__') &&
            !file.includes('node_modules') &&
            !file.match(/dist(\/|$)/)
          )
        }
      })

      const testCustomServe = resolve(dirname(testPath), 'serve.js')
      if (fs.existsSync(testCustomServe)) {
        // test has custom server configuration.
        const { serve } = require(testCustomServe)
        server = await serve(tempDir, isBuildTest)
        return
      }

      const options: UserConfig = {
        root: tempDir,
        logLevel: 'error',
        server: {
          watch: {
            // During tests we edit the files too fast and sometimes chokidar
            // misses change events, so enforce polling for consistency
            usePolling: true,
            interval: 100
          }
        },
        build: {
          // skip transpilation and dynamic import polyfills during tests to
          // make it faster
          target: 'esnext'
        }
      }

      if (!isBuildTest) {
        process.env.VITE_INLINE = 'inline-serve'
        server = await (await createServer(options)).listen()
        // use resolved port/base from server
        const base = server.config.base === '/' ? '' : server.config.base
        const url = (global.viteTestUrl = `http://localhost:${server.config.server.port}${base}`)
        await page.goto(url)
      } else {
        process.env.VITE_INLINE = 'inline-build'
        await build(options)
        const url = (global.viteTestUrl = await startStaticServer())
        await page.goto(url)
      }
    }
  } catch (e) {
    // jest doesn't exit if our setup has error here
    // https://github.com/facebook/jest/issues/2713
    err = e
  }
}, 30000)

afterAll(async () => {
  global.page?.off('console', onConsole)
  await global.page?.close()
  await server?.close()
  if (err) {
    throw err
  }
})

function startStaticServer(): Promise<string> {
  // check if the test project has base config
  const configFile = resolve(tempDir, 'vite.config.js')
  let config: UserConfig
  try {
    config = require(configFile)
  } catch (e) {}
  const base = (config?.base || '/') === '/' ? '' : config.base

  // @ts-ignore
  if (config && config.__test__) {
    // @ts-ignore
    config.__test__()
  }

  // start static file server
  const serve = sirv(resolve(tempDir, 'dist'))
  const httpServer = (server = http.createServer((req, res) => {
    if (req.url === '/ping') {
      res.statusCode = 200
      res.end('pong')
    } else {
      serve(req, res)
    }
  }))
  let port = 5000
  return new Promise((resolve, reject) => {
    const onError = (e: any) => {
      if (e.code === 'EADDRINUSE') {
        httpServer.close()
        httpServer.listen(++port)
      } else {
        reject(e)
      }
    }
    httpServer.on('error', onError)
    httpServer.listen(port, () => {
      httpServer.removeListener('error', onError)
      resolve(`http://localhost:${port}${base}`)
    })
  })
}
