import { isBuild, findAssetFile, testDir, getBg } from 'testUtils'
import path from 'path'
import fs from 'fs'
import { ports } from '../../testUtils'

if (isBuild) {
  test('es', async () => {
    expect(await page.textContent('.es')).toBe('It works')
  })

  test('umd', async () => {
    expect(await page.textContent('.umd')).toBe('It works')
  })

  test('iife', async () => {
    expect(await page.textContent('.iife')).toBe('It works')
  })

  test('Library mode does not include `preload`', async () => {
    expect(await page.textContent('.dynamic-import-message')).toBe('hello vite')
    const code = fs.readFileSync(
      path.join(testDir, 'dist/lib/dynamic-import-message.js'),
      'utf-8'
    )
    expect(code).not.toMatch('__vitePreload')
  })

  test('emit assets in es', async () => {
    const src = await page.evaluate(async () => {
      return (document.querySelector('.emit-es') as HTMLImageElement).src
    })

    expect(src).toMatch(`http://localhost:${ports.lib}`)
  })

  test('not emit assets in other format', async () => {
    const src = await page.evaluate(async () => {
      return (document.querySelector('.emit-umd') as HTMLImageElement).src
    })

    expect(src).toMatch('data:image/png;base64')
  })
} else {
  test('dev', async () => {
    expect(await page.textContent('.demo')).toBe('It works')
  })
}
