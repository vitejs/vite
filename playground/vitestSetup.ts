import type * as http from 'node:http'
import path, { dirname, join, resolve } from 'node:path'
import os from 'node:os'
import fs from 'fs-extra'
import { chromium } from 'playwright-chromium'
import type {
  InlineConfig,
  Logger,
  PluginOption,
  ResolvedConfig,
  UserConfig,
  ViteDevServer,
} from 'vite'
import {
  build,
  createServer,
  loadConfigFromFile,
  mergeConfig,
  preview,
} from 'vite'
import type { Browser, Page } from 'playwright-chromium'
import type { RollupError, RollupWatcher, RollupWatcherEvent } from 'rollup'
import type { File } from 'vitest'
import { beforeAll } from 'vitest'

// #region env

export const workspaceRoot = resolve(__dirname, '../')

export const isBuild = !!process.env.VITE_TEST_BUILD
export const isServe = !isBuild
export const isWindows = process.platform === 'win32'
export const viteBinPath = path.posix.join(
  workspaceRoot,
  'packages/vite/bin/vite.js',
)

// #endregion

// #region context

let server: ViteDevServer | http.Server

/**
 * Vite Dev Server when testing serve
 */
export let viteServer: ViteDevServer
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
/**
 * current test using vite inline config
 * when using server.js is not possible to get the config
 */
export let viteConfig: InlineConfig | undefined

export const serverLogs: string[] = []
export const browserLogs: string[] = []
export const browserErrors: Error[] = []

export let resolvedConfig: ResolvedConfig = undefined!

export let page: Page = undefined!
export let browser: Browser = undefined!
export let viteTestUrl: string = ''
export let watcher: RollupWatcher | undefined = undefined

declare module 'vite' {
  interface InlineConfig {
    testConfig?: {
      // relative base output use relative path
      // rewrite the url to truth file path
      baseRoute: string
    }
  }

  interface UserConfig {
    testConfig?: {
      baseRoute: string
    }
  }
}

export function setViteUrl(url: string): void {
  viteTestUrl = url
}

// #endregion

const DIR = join(os.tmpdir(), 'vitest_playwright_global_setup')

beforeAll(async (s) => {
  const suite = s as File
  // skip browser setup for non-playground tests
  if (!suite.filepath.includes('playground')) {
    return
  }

  const wsEndpoint = fs.readFileSync(join(DIR, 'wsEndpoint'), 'utf-8')
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
      // ignore favicon request in headed browser
      if (
        process.env.VITE_DEBUG_SERVE &&
        msg.text().includes('Failed to load resource:') &&
        msg.location().url.includes('favicon.ico')
      ) {
        return
      }
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
        resolve(dirname(testPath), 'serve.js'),
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
          viteServer = mod.viteServer
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
    await watcher?.close()
    if (browser) {
      await browser.close()
    }
  }
})

function loadConfigFromDir(dir: string) {
  return loadConfigFromFile(
    {
      command: isBuild ? 'build' : 'serve',
      mode: isBuild ? 'production' : 'development',
    },
    undefined,
    dir,
  )
}

export async function startDefaultServe(): Promise<void> {
  let config: UserConfig | null = null
  // config file near the *.spec.ts
  const res = await loadConfigFromDir(dirname(testPath))
  if (res) {
    config = res.config
  }
  // config file from test root dir
  if (!config) {
    const res = await loadConfigFromDir(rootDir)
    if (res) {
      config = res.config
    }
  }

  const options: InlineConfig = {
    root: rootDir,
    logLevel: 'silent',
    configFile: false,
    server: {
      watch: {
        // During tests we edit the files too fast and sometimes chokidar
        // misses change events, so enforce polling for consistency
        usePolling: true,
        interval: 100,
      },
      host: true,
      fs: {
        strict: !isBuild,
      },
    },
    build: {
      // esbuild do not minify ES lib output since that would remove pure annotations and break tree-shaking
      // skip transpilation during tests to make it faster
      target: 'esnext',
      // tests are flaky when `emptyOutDir` is `true`
      emptyOutDir: false,
    },
    customLogger: createInMemoryLogger(serverLogs),
  }

  setupConsoleWarnCollector(serverLogs)

  if (!isBuild) {
    process.env.VITE_INLINE = 'inline-serve'
    const testConfig = mergeConfig(options, config || {})
    viteConfig = testConfig
    viteServer = server = await (await createServer(testConfig)).listen()
    // use resolved port/base from server
    const devBase = server.config.base
    viteTestUrl = `http://localhost:${server.config.server.port}${
      devBase === '/' ? '' : devBase
    }`
    await page.goto(viteTestUrl)
  } else {
    process.env.VITE_INLINE = 'inline-build'
    // determine build watch
    const resolvedPlugin: () => PluginOption = () => ({
      name: 'vite-plugin-watcher',
      configResolved(config) {
        resolvedConfig = config
      },
    })
    options.plugins = [resolvedPlugin()]
    const testConfig = mergeConfig(options, config || {})
    viteConfig = testConfig
    const rollupOutput = await build(testConfig)
    const isWatch = !!resolvedConfig!.build.watch
    // in build watch,call startStaticServer after the build is complete
    if (isWatch) {
      watcher = rollupOutput as RollupWatcher
      await notifyRebuildComplete(watcher)
    }
    if (config && config.__test__) {
      config.__test__()
    }
    const _nodeEnv = process.env.NODE_ENV
    const previewServer = await preview(testConfig)
    // prevent preview change NODE_ENV
    process.env.NODE_ENV = _nodeEnv
    viteTestUrl = previewServer.resolvedUrls.local[0]
    await page.goto(viteTestUrl)
  }
}

/**
 * Send the rebuild complete message in build watch
 */
export async function notifyRebuildComplete(
  watcher: RollupWatcher,
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
  return watcher.off('event', callback)
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
    },
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

declare module 'vite' {
  export interface UserConfig {
    /**
     * special test only hook
     *
     * runs after build and before preview
     */
    __test__?: () => void
  }
}
