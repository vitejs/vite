import { isBuild, findAssetFile, testDir, getBg } from 'testUtils'
import path from 'path'
import fs from 'fs'

if (isBuild) {
  test('es', async () => {
    expect(await page.textContent('.es')).toBe('It works')
  })

  test('umd', async () => {
    expect(await page.textContent('.umd')).toBe('It works')
  })

  test('lib: emitAssets:undefined|false = is inlined', async () => {
    const match = `data:image/png;base64`
    expect(await getBg('.emitAssets-default')).toMatch(match)
  })

  test('lib: emitAssets:true = is emitted', async () => {
    const match = /\/assets\/asset\.\w{8}\.png/
    expect(await getBg('.emitAssets-true')).toMatch(match)
  })

  test('Library mode does not include `preload`', async () => {
    expect(await page.textContent('.dynamic-import-message')).toBe('hello vite')
    const code = fs.readFileSync(
      path.join(testDir, 'dist/lib/dynamic-import-message.js'),
      'utf-8'
    )
    expect(code).not.toMatch('__vitePreload')
  })
} else {
  test('dev', async () => {
    expect(await page.textContent('.demo')).toBe('It works')
  })
}
