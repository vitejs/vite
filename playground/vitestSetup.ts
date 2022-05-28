import * as http from 'http'
import { dirname, resolve } from 'path'
import os from 'os'
import path from 'path'
import sirv from 'sirv'
import fs from 'fs-extra'
import { chromium } from 'playwright-chromium'
import type {
  InlineConfig,
  Logger,
  PluginOption,
  ResolvedConfig,
  ViteDevServer
} from 'vite'
import { build, createServer, mergeConfig } from 'vite'
import type { Browser, Page } from 'playwright-chromium'
import type { RollupError, RollupWatcher, RollupWatcherEvent } from 'rollup'
import type { File } from 'vitest'
import { beforeAll } from 'vitest'

// #region env

export const workspaceRoot = path.resolve(__dirname, '../')

export const isBuild = !!process.env.VITE_TEST_BUILD
export const isServe = !isBuild
export const isWindows = process.platform === 'win32'
export const viteBinPath = path.join(workspaceRoot, 'packages/vite/bin/vite.js')

// #endregion

// #region context

let server: ViteDevServer | http.Server

/**
 * Root of the Vite fixture
 */
export let rootDir: string
/**
 * Path to the current test file
 */
export let testPath: string
/**
 * Path to the test folder
 */
export let testDir: string
/**
 * Test folder name
 */
export let testName: string

export const serverLogs: string[] = []
export const browserLogs: string[] = []
export const browserErrors: Error[] = []

export let resolvedConfig: ResolvedConfig = undefined!

export let page: Page = undefined!
export let browser: Browser = undefined!
export let viteTestUrl: string = ''
export let watcher: RollupWatcher | undefined = undefined

export function setViteUrl(url: string) {
  viteTestUrl = url
}

// #endregion

const DIR = path.join(os.tmpdir(), 'vitest_playwright_global_setup')

beforeAll(async (s) => {
  const suite = s as File
  // skip browser setup for non-playground tests
  if (!suite.filepath.includes('playground')) {
    return
  }

  const wsEndpoint = fs.readFileSync(path.join(DIR, 'wsEndpoint'), 'utf-8')
  if (!wsEndpoint) {
    throw new Error('wsEndpoint not found')
  }

  browser = await chromium.connect(wsEndpoint)
  page = await browser.newPage()

  const globalConsole = global.console
  const warn = globalConsole.warn
  globalConsole.warn = (msg, ...args) => {
    // suppress @vue/reactivity-transform warning
    if (msg.includes('@vue/reactivity-transform')) return
    if (msg.includes('Generated an empty chunk')) return
    warn.call(globalConsole, msg, ...args)
  }

  try {
    page.on('console', (msg) => {
      browserLogs.push(msg.text())
    })
    page.on('pageerror', (error) => {
      browserErrors.push(error)
    })

    testPath = suite.filepath!
    testName = slash(testPath).match(/playground\/([\w-]+)\//)?.[1]
    testDir = dirname(testPath)

    // if this is a test placed under playground/xxx/__tests__
    // start a vite server in that directory.
    if (testName) {
      testDir = resolve(workspaceRoot, 'playground-temp', testName)

      // when `root` dir is present, use it as vite's root
      const testCustomRoot = resolve(testDir, 'root')
      rootDir = fs.existsSync(testCustomRoot) ? testCustomRoot : testDir

      const testCustomServe = [
        resolve(dirname(testPath), 'serve.ts'),
        resolve(dirname(testPath), 'serve.js')
      ].find((i) => fs.existsSync(i))

      if (testCustomServe) {
        // test has custom server configuration.
        const mod = await import(testCustomServe)
        const serve = mod.serve || mod.default?.serve
        const preServe = mod.preServe || mod.default?.preServe
        if (preServe) {
          await preServe()
        }
        if (serve) {
          server = await serve()
          return
        }
      } else {
        await startDefaultServe()
      }
    }
  } catch (e) {
    // Closing the page since an error in the setup, for example a runtime error
    // when building the playground should skip further tests.
    // If the page remains open, a command like `await page.click(...)` produces
    // a timeout with an exception that hides the real error in the console.
    await page.close()
    await server?.close()
    throw e
  }

  return async () => {
    serverLogs.length = 0
    await page?.close()
    await server?.close()
    watcher?.close()
    if (browser) {
      await browser.close()
    }
  }
})

export async function startDefaultServe() {
  const testCustomConfig = resolve(dirname(testPath), 'vite.config.js')
  let config: InlineConfig | undefined
  if (fs.existsSync(testCustomConfig)) {
    // test has custom server configuration.
    config = await import(testCustomConfig).then((r) => r.default)
  }

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
        strict: !isBuild
      }
    },
    build: {
      // esbuild do not minify ES lib output since that would remove pure annotations and break tree-shaking
      // skip transpilation during tests to make it faster
      target: 'esnext'
    },
    customLogger: createInMemoryLogger(serverLogs)
  }

  setupConsoleWarnCollector(serverLogs)

  if (!isBuild) {
    process.env.VITE_INLINE = 'inline-serve'
    server = await (
      await createServer(mergeConfig(options, config || {}))
    ).listen()
    // use resolved port/base from server
    const base = server.config.base === '/' ? '' : server.config.base
    viteTestUrl = `http://localhost:${server.config.server.port}${base}`
    await page.goto(viteTestUrl)
  } else {
    process.env.VITE_INLINE = 'inline-build'
    // determine build watch
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
      watcher = rollupOutput as RollupWatcher
      await notifyRebuildComplete(watcher)
    }
    viteTestUrl = await startStaticServer(config)
    await page.goto(viteTestUrl)
  }
}

function startStaticServer(config?: InlineConfig): Promise<string> {
  if (!config) {
    // check if the test project has base config
    const configFile = resolve(rootDir, 'vite.config.js')
    try {
      config = require(configFile)
    } catch (e) {}
  }

  // fallback internal base to ''
  let base = config?.base
  if (!base || base === '/' || base === './') {
    base = ''
  }

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
  let resolveFn: undefined | (() => void)
  const callback = (event: RollupWatcherEvent): void => {
    if (event.code === 'END') {
      resolveFn?.()
    }
  }
  watcher.on('event', callback)
  await new Promise<void>((resolve) => {
    resolveFn = resolve
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

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}
