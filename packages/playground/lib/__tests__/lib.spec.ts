import { isBuild, findAssetFile, testDir } from 'testUtils'
import path from 'path'
import fs from 'fs'

if (isBuild) {
  test('es', async () => {
    expect(await page.textContent('.es')).toBe('It works')
  })

  test('umd', async () => {
    expect(await page.textContent('.umd')).toBe('It works')
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
