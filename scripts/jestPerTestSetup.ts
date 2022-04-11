import fs from 'fs-extra'
import * as http from 'http'
import { resolve, dirname } from 'path'
import sirv from 'sirv'
import type {
  ViteDevServer,
  InlineConfig,
  PluginOption,
  ResolvedConfig,
  Logger
} from 'vite'
import { createServer, build, mergeConfig } from 'vite'
import type { Page, ConsoleMessage } from 'playwright-chromium'
import type { RollupError, RollupWatcher, RollupWatcherEvent } from 'rollup'

const isBuildTest = !!process.env.VITE_TEST_BUILD

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

// injected by the test env
declare global {
  const page: Page | undefined

  const browserLogs: string[]
  const serverLogs: string[]
  const viteTestUrl: string | undefined
  const watcher: RollupWatcher | undefined
  let beforeAllError: Error | null // error caught in beforeAll, useful if you want to test error scenarios on build
}

declare const global: {
  page?: Page

  browserLogs: string[]
  serverLogs: string[]
  viteTestUrl?: string
  watcher?: RollupWatcher
  beforeAllError: Error | null
}

let server: ViteDevServer | http.Server
let tempDir: string
let rootDir: string

const setBeforeAllError = (err: Error | null) => {
  global.beforeAllError = err
}
const getBeforeAllError = () => global.beforeAllError
//init with null so old errors don't carry over
setBeforeAllError(null)

const logs: string[] = (global.browserLogs = [])
const onConsole = (msg: ConsoleMessage) => {
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
      tempDir = resolve(__dirname, '../packages/temp/', testName)

      // when `root` dir is present, use it as vite's root
      const testCustomRoot = resolve(tempDir, 'root')
      rootDir = fs.existsSync(testCustomRoot) ? testCustomRoot : tempDir

      const testCustomServe = resolve(dirname(testPath), 'serve.js')
      if (fs.existsSync(testCustomServe)) {
        // test has custom server configuration.
        const { serve, preServe } = require(testCustomServe)
        if (preServe) {
          await preServe(rootDir, isBuildTest)
        }
        if (serve) {
          server = await serve(rootDir, isBuildTest)
          return
        }
      }

      const testCustomConfig = resolve(dirname(testPath), 'vite.config.js')
      let config: InlineConfig | undefined
      if (fs.existsSync(testCustomConfig)) {
        // test has custom server configuration.
        config = require(testCustomConfig)
      }

      const serverLogs: string[] = []

      const options: InlineConfig = {
        root: rootDir,
        logLevel: 'silent',
        server: {
          watch: {
            // During tests we edit the files too fast and sometimes chokidar
            // misses change events, so enforce polling for consistency
            usePolling: true,
            interval: 100
          },
          host: true,
          fs: {
            strict: !isBuildTest
          }
        },
        build: {
          // skip transpilation during tests to make it faster
          target: 'esnext'
        },
        customLogger: createInMemoryLogger(serverLogs)
      }

      setupConsoleWarnCollector(serverLogs)

      global.serverLogs = serverLogs

      if (!isBuildTest) {
        process.env.VITE_INLINE = 'inline-serve'
        server = await (
          await createServer(mergeConfig(options, config || {}))
        ).listen()
        // use resolved port/base from server
        const base = server.config.base === '/' ? '' : server.config.base
        const url =
          (global.viteTestUrl = `http://localhost:${server.config.server.port}${base}`)
        await page.goto(url)
      } else {
        process.env.VITE_INLINE = 'inline-build'
        // determine build watch
        let resolvedConfig: ResolvedConfig
        const resolvedPlugin: () => PluginOption = () => ({
          name: 'vite-plugin-watcher',
          configResolved(config) {
            resolvedConfig = config
          }
        })
        options.plugins = [resolvedPlugin()]
        const rollupOutput = await build(mergeConfig(options, config || {}))
        const isWatch = !!resolvedConfig!.build.watch
        // in build watch,call startStaticServer after the build is complete
        if (isWatch) {
          global.watcher = rollupOutput as RollupWatcher
          await notifyRebuildComplete(global.watcher)
        }
        const url = (global.viteTestUrl = await startStaticServer(config))
        await page.goto(url)
      }
    }
  } catch (e: any) {
    // jest doesn't exit if our setup has error here
    // https://github.com/facebook/jest/issues/2713
    setBeforeAllError(e)

    // Closing the page since an error in the setup, for example a runtime error
    // when building the playground should skip further tests.
    // If the page remains open, a command like `await page.click(...)` produces
    // a timeout with an exception that hides the real error in the console.
    await page.close()
  }
}, 30000)

afterAll(async () => {
  global.page?.off('console', onConsole)
  global.serverLogs = []
  await global.page?.close()
  await server?.close()
  global.watcher?.close()
  const beforeAllErr = getBeforeAllError()
  if (beforeAllErr) {
    throw beforeAllErr
  }
})

function startStaticServer(config?: InlineConfig): Promise<string> {
  if (!config) {
    // check if the test project has base config
    const configFile = resolve(rootDir, 'vite.config.js')
    try {
      config = require(configFile)
    } catch (e) {}
  }

  // fallback internal base to ''
  const base = (config?.base ?? '/') === '/' ? '' : config?.base ?? ''

  // @ts-ignore
  if (config && config.__test__) {
    // @ts-ignore
    config.__test__()
  }

  // start static file server
  const serve = sirv(resolve(rootDir, 'dist'), { dev: !!config?.build?.watch })
  const httpServer = (server = http.createServer((req, res) => {
    if (req.url === '/ping') {
      res.statusCode = 200
      res.end('pong')
    } else {
      serve(req, res)
    }
  }))
  let port = 4173
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

/**
 * Send the rebuild complete message in build watch
 */
export async function notifyRebuildComplete(
  watcher: RollupWatcher
): Promise<RollupWatcher> {
  let callback: (event: RollupWatcherEvent) => void
  await new Promise<void>((resolve, reject) => {
    callback = (event) => {
      if (event.code === 'END') {
        resolve()
      }
    }
    watcher.on('event', callback)
  })
  return watcher.removeListener('event', callback)
}

function createInMemoryLogger(logs: string[]): Logger {
  const loggedErrors = new WeakSet<Error | RollupError>()
  const warnedMessages = new Set<string>()

  const logger: Logger = {
    hasWarned: false,
    hasErrorLogged: (err) => loggedErrors.has(err),
    clearScreen: () => {},
    info(msg) {
      logs.push(msg)
    },
    warn(msg) {
      logs.push(msg)
      logger.hasWarned = true
    },
    warnOnce(msg) {
      if (warnedMessages.has(msg)) return
      logs.push(msg)
      logger.hasWarned = true
      warnedMessages.add(msg)
    },
    error(msg, opts) {
      logs.push(msg)
      if (opts?.error) {
        loggedErrors.add(opts.error)
      }
    }
  }

  return logger
}

function setupConsoleWarnCollector(logs: string[]) {
  const warn = console.warn
  console.warn = (...args) => {
    serverLogs.push(args.join(' '))
    return warn.call(console, ...args)
  }
}
