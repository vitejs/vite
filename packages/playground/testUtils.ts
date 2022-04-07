// test utils used in e2e tests for playgrounds.
// this can be directly imported in any playground tests as 'testUtils', e.g.
// `import { getColor } from 'testUtils'`

import fs from 'fs'
import path from 'path'
import colors from 'css-color-names'
import type { ElementHandle, ConsoleMessage } from 'playwright-chromium'
import { Manifest, normalizePath } from 'vite'
import { fromComment } from 'convert-source-map'

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export const isBuild = !!process.env.VITE_TEST_BUILD

const testPath = expect.getState().testPath
const testName = slash(testPath).match(/playground\/([\w-]+)\//)?.[1]
export const testDir = path.resolve(__dirname, '../../packages/temp', testName)
export const workspaceRoot = path.resolve(__dirname, '../../')

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
  return hexToNameMap[rgbToHex(rgb)] ?? rgb
}

export async function getBg(el: string | ElementHandle): Promise<string> {
  el = await toEl(el)
  return el.evaluate((el) => getComputedStyle(el as Element).backgroundImage)
}

export async function getBgColor(el: string | ElementHandle): Promise<string> {
  el = await toEl(el)
  return el.evaluate((el) => getComputedStyle(el as Element).backgroundColor)
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
    const actual = (await poll()) ?? ''
    if (actual.indexOf(expected) > -1 || tries === maxTries - 1) {
      expect(actual).toMatch(expected)
      break
    } else {
      await timeout(50)
    }
  }
}

export async function untilBrowserLogAfter(
  operation: () => any,
  target: string | RegExp | Array<string | RegExp>,
  callback?: (logs: string[]) => PromiseLike<void> | void
): Promise<string[]> {
  const promise = untilBrowserLog(target, false)
  await operation()
  const logs = await promise
  if (callback) {
    await callback(logs)
  }
  return logs
}

async function untilBrowserLog(
  target?: string | RegExp | Array<string | RegExp>,
  expectOrder = true
): Promise<string[]> {
  let resolve: () => void
  let reject: (reason: any) => void
  const promise = new Promise<void>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

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
        let remainingMatchers = target.map(isMatch)
        processMsg = (text: string) => {
          const nextIndex = remainingMatchers.findIndex(
            (matcher) => !matcher(text)
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

/**
 * Send the rebuild complete message in build watch
 */
export { notifyRebuildComplete } from '../../scripts/jestPerTestSetup'

export const extractSourcemap = (content: string) => {
  const lines = content.trim().split('\n')
  return fromComment(lines[lines.length - 1]).toObject()
}

export const formatSourcemapForSnapshot = (map: any) => {
  const root = normalizePath(testDir)
  const m = { ...map }
  delete m.file
  delete m.names
  m.sources = m.sources.map((source) => source.replace(root, '/root'))
  return m
}
