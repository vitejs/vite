import { expect, test } from 'vitest'
import { port } from './serve'
import { findAssetFile, isBuild, listAssets, page } from '~utils'

const url = `http://localhost:${port}`

test('should work when inlined', async () => {
  await page.goto(`${url}/static-light`)
  expect(await page.textContent('.static-light')).toMatch('42')
})

test('should work when output', async () => {
  await page.goto(`${url}/static-heavy`)
  expect(await page.textContent('.static-heavy')).toMatch('24')
})

test.runIf(isBuild)('should not contain wasm file when inlined', async () => {
  const assets = await listAssets()
  const lightWasm = assets.find((f) => /light-.+\.wasm$/.test(f))
  expect(lightWasm).toBeUndefined()

  const staticLight = await findAssetFile(/^static-light-.+\.js$/)
  expect(staticLight).toContain('data:application/wasm;base64,')
})

test.runIf(isBuild)(
  'should contain and reference wasm file when output',
  async () => {
    const assets = await listAssets()
    const heavyWasm = assets.find((f) => /heavy-.+\.wasm$/.test(f))
    expect(heavyWasm).toBeDefined()

    const staticHeavy = await findAssetFile(/^static-heavy-.+\.js$/)
    expect(staticHeavy).toContain(heavyWasm)
    expect(staticHeavy).not.toContain('data:application/wasm;base64,')
  },
)
