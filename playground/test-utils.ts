// test utils used in e2e tests for playgrounds.
// `import { getColor } from '~utils'`

import fs from 'node:fs'
import path from 'node:path'
import colors from 'css-color-names'
import type {
  ConsoleMessage,
  ElementHandle,
  Locator,
} from 'playwright-chromium'
import type { DepOptimizationMetadata, Manifest } from 'vite'
import { normalizePath } from 'vite'
import { fromComment } from 'convert-source-map'
import type { Assertion } from 'vitest'
import { expect } from 'vitest'
import type { ResultPromise as ExecaResultPromise } from 'execa'
import { isBuild, isWindows, page, testDir } from './vitestSetup'

export * from './vitestSetup'

// make sure these ports are unique
export const ports = {
  cli: 9510,
  'cli-module': 9511,
  json: 9512,
  'legacy/ssr': 9520,
  lib: 9521,
  'optimize-missing-deps': 9522,
  'legacy/client-and-ssr': 9523,
  'assets/encoded-base': 9554, // not imported but used in `assets/vite.config-encoded-base.js`
  'assets/url-base': 9525, // not imported but used in `assets/vite.config-url-base.js`
  ssr: 9600,
  'ssr-deps': 9601,
  'ssr-html': 9602,
  'ssr-noexternal': 9603,
  'ssr-pug': 9604,
  'ssr-webworker': 9605,
  'proxy-bypass': 9606, // not imported but used in `proxy-hmr/vite.config.js`
  'proxy-bypass/non-existent-app': 9607, // not imported but used in `proxy-hmr/other-app/vite.config.js`
  'ssr-hmr': 9609, // not imported but used in `hmr-ssr/__tests__/hmr.spec.ts`
  'proxy-hmr': 9616, // not imported but used in `proxy-hmr/vite.config.js`
  'proxy-hmr/other-app': 9617, // not imported but used in `proxy-hmr/other-app/vite.config.js`
  'ssr-conditions': 9620,
  'css/postcss-caching': 5005,
  'css/postcss-plugins-different-dir': 5006,
  'css/dynamic-import': 5007,
  'css/lightningcss-proxy': 5008,
  'backend-integration': 5009,
  'client-reload': 5010,
  'client-reload/hmr-port': 5011,
  'client-reload/cross-origin': 5012,
}
export const hmrPorts = {
  'optimize-missing-deps': 24680,
  ssr: 24681,
  'ssr-deps': 24682,
  'ssr-html': 24683,
  'ssr-noexternal': 24684,
  'ssr-pug': 24685,
  'css/lightningcss-proxy': 24686,
  json: 24687,
  'ssr-conditions': 24688,
  'client-reload/hmr-port': 24689,
  'client-reload/cross-origin': 24690,
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

async function toEl(
  el: string | ElementHandle | Locator,
): Promise<ElementHandle> {
  if (typeof el === 'string') {
    const realEl = await page.$(el)
    if (realEl == null) {
      throw new Error(`Cannot find element: "${el}"`)
    }
    return realEl
  }
  if ('elementHandle' in el) {
    return el.elementHandle()
  }
  return el
}

export async function getColor(
  el: string | ElementHandle | Locator,
): Promise<string> {
  el = await toEl(el)
  const rgb = await el.evaluate((el) => getComputedStyle(el as Element).color)
  return hexToNameMap[rgbToHex(rgb)] ?? rgb
}

export async function getBg(
  el: string | ElementHandle | Locator,
): Promise<string> {
  el = await toEl(el)
  return el.evaluate((el) => getComputedStyle(el as Element).backgroundImage)
}

export async function getBgColor(
  el: string | ElementHandle | Locator,
): Promise<string> {
  el = await toEl(el)
  return el.evaluate((el) => getComputedStyle(el as Element).backgroundColor)
}

export function readFile(filename: string): string {
  return fs.readFileSync(path.resolve(testDir, filename), 'utf-8')
}

export function editFile(
  filename: string,
  replacer: (str: string) => string,
  runInBuild: boolean = false,
): void {
  if (isBuild && !runInBuild) return
  filename = path.resolve(testDir, filename)
  const content = fs.readFileSync(filename, 'utf-8')
  const modified = replacer(content)
  fs.writeFileSync(filename, modified)
}

export function addFile(filename: string, content: string): void {
  const resolvedFilename = path.resolve(testDir, filename)
  fs.mkdirSync(path.dirname(resolvedFilename), { recursive: true })
  fs.writeFileSync(resolvedFilename, content)
}

export function removeFile(filename: string): void {
  fs.unlinkSync(path.resolve(testDir, filename))
}

export function listAssets(base = ''): string[] {
  const assetsDir = path.join(testDir, 'dist', base, 'assets')
  return fs.readdirSync(assetsDir)
}

export function findAssetFile(
  match: string | RegExp,
  base = '',
  assets = 'assets',
  matchAll = false,
): string {
  const assetsDir = path.join(testDir, 'dist', base, assets)
  let files: string[]
  try {
    files = fs.readdirSync(assetsDir)
  } catch (e) {
    if (e.code === 'ENOENT') {
      return ''
    }
    throw e
  }
  if (matchAll) {
    const matchedFiles = files.filter((file) => file.match(match))
    return matchedFiles.length
      ? matchedFiles
          .map((file) =>
            fs.readFileSync(path.resolve(assetsDir, file), 'utf-8'),
          )
          .join('')
      : ''
  } else {
    const matchedFile = files.find((file) => file.match(match))
    return matchedFile
      ? fs.readFileSync(path.resolve(assetsDir, matchedFile), 'utf-8')
      : ''
  }
}

export function readManifest(base = ''): Manifest {
  return JSON.parse(
    fs.readFileSync(
      path.join(testDir, 'dist', base, '.vite/manifest.json'),
      'utf-8',
    ),
  )
}

export function readDepOptimizationMetadata(): DepOptimizationMetadata {
  return JSON.parse(
    fs.readFileSync(
      path.join(testDir, 'node_modules/.vite/deps/_metadata.json'),
      'utf-8',
    ),
  )
}

/**
 * Poll a getter until the value it returns includes the expected value.
 */
export async function untilUpdated(
  poll: () => string | Promise<string>,
  expected: string | RegExp,
  runInBuild = false,
): Promise<void> {
  if (isBuild && !runInBuild) return
  const maxTries = process.env.CI ? 200 : 50
  for (let tries = 0; tries < maxTries; tries++) {
    const actual = (await poll()) ?? ''
    if (
      (typeof expected === 'string'
        ? actual.indexOf(expected) > -1
        : actual.match(expected)) ||
      tries === maxTries - 1
    ) {
      expect(actual).toMatch(expected)
      break
    } else {
      await timeout(50)
    }
  }
}

/**
 * Retry `func` until it does not throw error.
 */
export async function withRetry(
  func: () => Promise<void>,
  runInBuild = false,
): Promise<void> {
  if (isBuild && !runInBuild) return
  const maxTries = process.env.CI ? 200 : 50
  for (let tries = 0; tries < maxTries; tries++) {
    try {
      await func()
      return
    } catch {}
    await timeout(50)
  }
  await func()
}

export const expectWithRetry = <T>(getActual: () => Promise<T>) => {
  return new Proxy(
    {},
    {
      get(_target, key) {
        return async (...args) => {
          await withRetry(
            async () => expect(await getActual())[key](...args),
            true,
          )
        }
      },
    },
  ) as Assertion<T>['resolves']
  // NOTE: `Assertion<T>['resolves']` has the special "promisify all assertion property functions"
  // behaviour that we're lending here, which is the same as `PromisifyAssertion<T>` if Vitest exposes it
}

type UntilBrowserLogAfterCallback = (logs: string[]) => PromiseLike<void> | void

export async function untilBrowserLogAfter(
  operation: () => any,
  target: string | RegExp | Array<string | RegExp>,
  expectOrder?: boolean,
  callback?: UntilBrowserLogAfterCallback,
): Promise<string[]>
export async function untilBrowserLogAfter(
  operation: () => any,
  target: string | RegExp | Array<string | RegExp>,
  callback?: UntilBrowserLogAfterCallback,
): Promise<string[]>
export async function untilBrowserLogAfter(
  operation: () => any,
  target: string | RegExp | Array<string | RegExp>,
  arg3?: boolean | UntilBrowserLogAfterCallback,
  arg4?: UntilBrowserLogAfterCallback,
): Promise<string[]> {
  const expectOrder = typeof arg3 === 'boolean' ? arg3 : false
  const callback = typeof arg3 === 'boolean' ? arg4 : arg3

  const promise = untilBrowserLog(target, expectOrder)
  await operation()
  const logs = await promise
  if (callback) {
    await callback(logs)
  }
  return logs
}

async function untilBrowserLog(
  target?: string | RegExp | Array<string | RegExp>,
  expectOrder = true,
): Promise<string[]> {
  const { promise, resolve, reject } = promiseWithResolvers<void>()

  const logs = []

  try {
    const isMatch = (matcher: string | RegExp) => (text: string) =>
      typeof matcher === 'string' ? text === matcher : matcher.test(text)

    let processMsg: (text: string) => boolean

    if (!target) {
      processMsg = () => true
    } else if (Array.isArray(target)) {
      if (expectOrder) {
        const remainingTargets = [...target]
        processMsg = (text: string) => {
          const nextTarget = remainingTargets.shift()
          expect(text).toMatch(nextTarget)
          return remainingTargets.length === 0
        }
      } else {
        const remainingMatchers = target.map(isMatch)
        processMsg = (text: string) => {
          const nextIndex = remainingMatchers.findIndex((matcher) =>
            matcher(text),
          )
          if (nextIndex >= 0) {
            remainingMatchers.splice(nextIndex, 1)
          }
          return remainingMatchers.length === 0
        }
      }
    } else {
      processMsg = isMatch(target)
    }

    const handleMsg = (msg: ConsoleMessage) => {
      try {
        const text = msg.text()
        logs.push(text)
        const done = processMsg(text)
        if (done) {
          resolve()
        }
      } catch (err) {
        reject(err)
      }
    }

    page.on('console', handleMsg)
  } catch (err) {
    reject(err)
  }

  await promise

  return logs
}

export const extractSourcemap = (content: string): any => {
  const lines = content.trim().split('\n')
  return fromComment(lines[lines.length - 1]).toObject()
}

export const formatSourcemapForSnapshot = (map: any): any => {
  const root = normalizePath(testDir)
  const m = { ...map }
  delete m.file
  delete m.names
  m.sources = m.sources.map((source) => source.replace(root, '/root'))
  if (m.sourceRoot) {
    m.sourceRoot = m.sourceRoot.replace(root, '/root')
  }
  return m
}

// helper function to kill process, uses taskkill on windows to ensure child process is killed too
export async function killProcess(
  serverProcess: ExecaResultPromise,
): Promise<void> {
  if (isWindows) {
    try {
      const { execaCommandSync } = await import('execa')
      execaCommandSync(`taskkill /pid ${serverProcess.pid} /T /F`)
    } catch (e) {
      console.error('failed to taskkill:', e)
    }
  } else {
    serverProcess.kill('SIGTERM')
  }
}

export interface PromiseWithResolvers<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
}
export function promiseWithResolvers<T>(): PromiseWithResolvers<T> {
  let resolve: any
  let reject: any
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  return { promise, resolve, reject }
}
