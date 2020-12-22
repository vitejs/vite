import fs from 'fs-extra'
import * as http from 'http'
import { resolve } from 'path'
import slash from 'slash'
import sirv from 'sirv'
import { createServer, build, ViteDevServer, UserConfig } from 'vite'
import { Page } from 'playwright-chromium'

const isBuildTest = !!process.env.VITE_TEST_BUILD

// injected by the test env
declare const page: Page

let server: ViteDevServer | http.Server
let tempDir: string
let err: Error

beforeAll(async () => {
  try {
    const testPath = expect.getState().testPath
    const testName = slash(testPath).match(/playground\/(\w+)\//)?.[1]

    // if this is a test placed under playground/xxx/__tests__
    // start a vite server in that directory.
    if (testName) {
      const playgroundRoot = resolve(__dirname, '../packages/playground')
      const srcDir = resolve(playgroundRoot, testName)
      tempDir = resolve(__dirname, '../temp', testName)
      await fs.copy(srcDir, tempDir, {
        dereference: true,
        filter(file) {
          return !file.includes('__tests__')
        }
      })

      const options: UserConfig = {
        root: tempDir,
        logLevel: 'error',
        server: {
          watch: {
            // During tests we edit the files too fast and sometimes chokidar
            // misses change events, so enforce polling for consistency
            usePolling: true,
            interval: 50
          }
        }
      }

      if (!isBuildTest) {
        server = await (await createServer(options)).listen()
        // use resolved port from server
        const url = `http://localhost:${server.config.server.port}`
        await page.goto(url)
      } else {
        await build(options)
        const url = await startStaticServer()
        await page.goto(url)
      }
    }
  } catch (e) {
    // jest doesn't exit if our setup has error here
    // https://github.com/facebook/jest/issues/2713
    err = e
  }
})

afterAll(async () => {
  if (server) {
    await server.close()
  }
  if (err) {
    throw err
  }
})

function startStaticServer(): Promise<string> {
  // start static file server
  const httpServer = (server = http.createServer(
    sirv(resolve(tempDir, 'dist'))
  ))
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
      resolve(`http://localhost:${port}`)
    })
  })
}
