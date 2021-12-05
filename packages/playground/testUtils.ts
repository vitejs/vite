// test utils used in e2e tests for playgrounds.
// this can be directly imported in any playground tests as 'testUtils', e.g.
// `import { getColor } from 'testUtils'`

import fs from 'fs-extra'
import path from 'path'
import colors from 'css-color-names'
import { ElementHandle } from 'playwright-chromium'
import expectExport from 'expect'
import * as http from 'http'
import sirv from 'sirv'
import {
  createServer,
  build,
  ViteDevServer,
  UserConfig,
  PluginOption,
  ResolvedConfig,
  Logger,
  Manifest
} from 'vite'
import { Page, Browser, chromium } from 'playwright-chromium'
// eslint-disable-next-line node/no-extraneous-import
import { RollupError, RollupWatcher, RollupWatcherEvent } from 'rollup'
import { suite, Test } from 'uvu'

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export let testDir: string
export const isBuild = !!process.env.VITE_TEST_BUILD
export const workspaceRoot = path.resolve(__dirname, '../../')

// injected by the test env
declare global {
  const page: Page | undefined
  const browser: Browser
  const expect: typeof expectExport

  const browserLogs: string[]
  const serverLogs: string[]
  const viteTestUrl: string | undefined
  const watcher: RollupWatcher | undefined
  let beforeAllError: Error | null // error caught in beforeAll, useful if you want to test error scenarios on build
}

declare const global: {
  page?: Page
  browser: Browser
  expect: typeof expectExport

  browserLogs: string[]
  serverLogs: string[]
  viteTestUrl?: string
  watcher?: RollupWatcher
  beforeAllError: Error | null
}

let server: ViteDevServer | http.Server
let tempDir: string
let rootDir: string

const setBeforeAllError = (err) => ((global as any).beforeAllError = err)
const getBeforeAllError = () => (global as any).beforeAllError
//init with null so old errors don't carry over
setBeforeAllError(null)

global.browserLogs = []
const onConsole = (msg) => {
  global.browserLogs.push(msg.text())
}

global.expect = expectExport

export async function uvuSetup(testPath: string) {
  global.browser = await chromium.launch({ headless: true })
  const page = (global.page = await global.browser.newPage())

  const testName = slash(testPath).match(/playground\/([\w-]+)\//)[1]
  testDir = path.resolve(__dirname, '../temp', testName)
  global.browserLogs = []

  try {
    page.on('console', onConsole)

    // if this is a test placed under playground/xxx/__tests__
    // start a vite server in that directory.
    if (testName) {
      tempDir = path.resolve(__dirname, '../temp/', testName)

      // when `root` dir is present, use it as vite's root
      const testCustomRoot = path.resolve(tempDir, 'root')
      rootDir = fs.existsSync(testCustomRoot) ? testCustomRoot : tempDir

      const testCustomServe = path.resolve(testPath, 'serve.cjs')
      if (fs.existsSync(testCustomServe)) {
        // test has custom server configuration.
        const { serve, preServe } = require(testCustomServe)
        if (preServe) {
          await preServe(rootDir, isBuild)
        }
        if (serve) {
          server = await serve(rootDir, isBuild)
          return
        }
      }

      const serverLogs: string[] = []

      const options: UserConfig = {
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
          // skip transpilation during tests to make it faster
          target: 'esnext'
        },
        customLogger: createInMemoryLogger(serverLogs)
      }

      global.serverLogs = serverLogs

      if (!isBuild) {
        process.env.VITE_INLINE = 'inline-serve'
        server = await (await createServer(options)).listen()
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
        const rollupOutput = await build(options)
        const isWatch = !!resolvedConfig!.build.watch
        // in build watch,call startStaticServer after the build is complete
        if (isWatch) {
          global.watcher = rollupOutput as RollupWatcher
          await notifyRebuildComplete(global.watcher)
        }
        const url = (global.viteTestUrl = await startStaticServer())
        await page.goto(url)
      }
    }
  } catch (e) {
    // jest doesn't exit if our setup has error here
    // https://github.com/facebook/jest/issues/2713
    setBeforeAllError(e)

    // Closing the page since an error in the setup, for example a runtime error
    // when building the playground should skip further tests.
    // If the page remains open, a command like `await page.click(...)` produces
    // a timeout with an exception that hides the real error in the console.
    await page.close()
  }
}

export async function uvuReset() {
  global.browserLogs = []
  global.page?.off('console', onConsole)
  global.serverLogs = []
  global.watcher?.close()
  await global.page?.close()
  await server?.close()
  await global.browser?.close()
  const beforeAllErr = getBeforeAllError()
  if (beforeAllErr) {
    throw beforeAllErr
  }
}

export function describe(name: string, fn: (test: Test) => void) {
  const s = suite(name)
  fn(s)
  s.run()
}

function startStaticServer(): Promise<string> {
  // check if the test project has base config
  const configFile = path.resolve(rootDir, 'vite.config.js')
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
  const serve = sirv(path.resolve(rootDir, 'dist'))
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

/**
 * Send the rebuild complete message in build watch
 */
export async function notifyRebuildComplete(
  watcher: RollupWatcher
): Promise<RollupWatcher> {
  let callback: (event: RollupWatcherEvent) => void
  await new Promise((resolve, reject) => {
    callback = (event) => {
      if (event.code === 'END') {
        resolve(true)
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

const hexToNameMap: Record<string, string> = {}
Object.keys(colors).forEach((color) => {
  hexToNameMap[colors[color]] = color
})

function componentToHex(c: number): string {
  const hex = c.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}

function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (match) {
    const [_, rs, gs, bs] = match
    return (
      '#' +
      componentToHex(parseInt(rs, 10)) +
      componentToHex(parseInt(gs, 10)) +
      componentToHex(parseInt(bs, 10))
    )
  } else {
    return '#000000'
  }
}

const timeout = (n: number) => new Promise((r) => setTimeout(r, n))

async function toEl(el: string | ElementHandle): Promise<ElementHandle> {
  if (typeof el === 'string') {
    return await page.$(el)
  }
  return el
}

export async function getColor(el: string | ElementHandle): Promise<string> {
  el = await toEl(el)
  const rgb = await el.evaluate((el) => getComputedStyle(el as Element).color)
  return hexToNameMap[rgbToHex(rgb)] || rgb
}

export async function getBg(el: string | ElementHandle): Promise<string> {
  el = await toEl(el)
  return el.evaluate((el) => getComputedStyle(el as Element).backgroundImage)
}

export function readFile(filename: string): string {
  return fs.readFileSync(path.resolve(testDir, filename), 'utf-8')
}

export function editFile(
  filename: string,
  replacer: (str: string) => string,
  runInBuild: boolean = false
): void {
  if (isBuild && !runInBuild) return
  filename = path.resolve(testDir, filename)
  const content = fs.readFileSync(filename, 'utf-8')
  const modified = replacer(content)
  fs.writeFileSync(filename, modified)
}

export function addFile(filename: string, content: string): void {
  fs.writeFileSync(path.resolve(testDir, filename), content)
}

export function removeFile(filename: string): void {
  fs.unlinkSync(path.resolve(testDir, filename))
}

export function listAssets(base = ''): string[] {
  const assetsDir = path.join(testDir, 'dist', base, 'assets')
  return fs.readdirSync(assetsDir)
}

export function findAssetFile(match: string | RegExp, base = ''): string {
  const assetsDir = path.join(testDir, 'dist', base, 'assets')
  const files = fs.readdirSync(assetsDir)
  const file = files.find((file) => {
    return file.match(match)
  })
  return file ? fs.readFileSync(path.resolve(assetsDir, file), 'utf-8') : ''
}

export function readManifest(base = ''): Manifest {
  return JSON.parse(
    fs.readFileSync(path.join(testDir, 'dist', base, 'manifest.json'), 'utf-8')
  )
}

/**
 * Poll a getter until the value it returns includes the expected value.
 */
export async function untilUpdated(
  poll: () => string | Promise<string>,
  expected: string,
  runInBuild = false
): Promise<void> {
  if (isBuild && !runInBuild) return
  const maxTries = process.env.CI ? 100 : 50
  for (let tries = 0; tries < maxTries; tries++) {
    const actual = (await poll()) || ''
    if (actual.indexOf(expected) > -1 || tries === maxTries - 1) {
      expect(actual).toMatch(expected)
      break
    } else {
      await timeout(50)
    }
  }
}
