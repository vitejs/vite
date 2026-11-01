import path from 'node:path'
import type { OutputAsset, RolldownOutput } from 'rolldown'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import type { InlineConfig } from '../../config'

vi.mock('lightningcss', () => {
  throw new Error("Cannot find module '../lightningcss.linux-ppc64-gnu.node'")
})

const root = path.resolve(import.meta.dirname, 'fixtures/lightningcss-wasm')
const expectedCss =
  '.a-dep{color:#00f}.a{color:red}.b-dep{color:#00f}.b{color:red}\n'

let build: typeof import('../../build').build

// Test files that share this worker may have loaded the native package already.
beforeAll(async () => {
  vi.resetModules()
  ;({ build } = await import('../../build'))
})

afterAll(() => {
  vi.doUnmock('lightningcss')
  vi.resetModules()
})

async function buildCss(config: InlineConfig = {}) {
  const result = (await build({
    root,
    logLevel: 'silent',
    build: {
      write: false,
      rolldownOptions: { input: path.join(root, 'index.js') },
    },
    ...config,
  })) as RolldownOutput
  const css = result.output.find(
    (output): output is OutputAsset =>
      output.type === 'asset' && output.fileName.endsWith('.css'),
  )
  return css!.source.toString()
}

describe('lightningcss-wasm', () => {
  test('minifies CSS when the native package fails to load', async () => {
    expect(await buildCss()).toBe(expectedCss)
  })

  test('bundles CSS files that Vite transforms concurrently with `css.transformer: lightningcss`', async () => {
    expect(await buildCss({ css: { transformer: 'lightningcss' } })).toBe(
      expectedCss,
    )
  })
})
