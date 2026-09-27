import { describe, expect, test } from 'vitest'
import { isBuild, page, readFile } from '~utils'

describe.runIf(isBuild)('build', () => {
  test('css links respect import order with manualChunks', async () => {
    const html = readFile('dist/index.html') as string
    // expect lib.css link appears before entry css link (index.css)
    const libHref = /href="(.*?)\/assets\/lib-([\w-]+)\.css"/g
    const indexHref = /href="(.*?)\/assets\/index-([\w-]+)\.css"/g

    const libMatch = libHref.exec(html)
    const indexMatch = indexHref.exec(html)

    expect(libMatch, 'lib.css link should exist').toBeTruthy()
    expect(indexMatch, 'index.css link should exist').toBeTruthy()

    expect(libMatch!.index).toBeLessThan(indexMatch!.index)
  })
})

test('runtime style precedence matches import order', async () => {
  // lib.css sets .box { color: green }, base.css sets .box { color: red }
  // If lib.css is loaded before index.css, final color should be red
  const color = await page.$eval('#app', (el) => getComputedStyle(el).color)
  expect(color).toBe('rgb(255, 0, 0)')
})
