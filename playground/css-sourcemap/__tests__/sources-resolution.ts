import { URL } from 'node:url'
import { describe, expect, test } from 'vitest'
import {
  extractSourcemap,
  isBundledDev,
  isServe,
  page,
  readFile,
  viteTestUrl,
} from '~utils'

export function testSourcesResolution() {
  const dir = 'nested/dir/'
  const files = ['dep.css', 'from-js.css']

  describe.runIf(isServe)('CSS sourcemap source URLs', () => {
    test.for(['/', '/admin/index.html'])(
      'style injected on %s',
      async (url, { skip }) => {
        skip(
          isBundledDev && url !== '/',
          'bundled dev only serves the configured HTML entry',
        )
        await page.goto(viteTestUrl + url)
        if (url === '/admin/index.html') {
          expect(await page.locator('p.from-js').allTextContents()).toEqual([
            'nested page importing the same css module',
          ])
        }
        const styles = await page.locator('style').allTextContents()
        const css = styles.find((text) => text.includes('.from-js {'))
        expect(css).toBeDefined()
        const map = extractSourcemap(css!)
        expect([...map.sources].sort()).toEqual(
          files.map((file) => '/' + dir + file),
        )
        for (const file of files) {
          const source = '/' + dir + file
          expect(map.sourcesContent[map.sources.indexOf(source)]).toBe(
            readFile(dir + file),
          )
          if (!isBundledDev) {
            const response = await page.request.get(
              new URL(source, page.url()).href,
              {
                headers: { accept: 'text/css' },
              },
            )
            expect(response.ok()).toBe(true)
            expect(await response.text()).toContain(
              file === 'dep.css' ? '.dep {' : '.from-js {',
            )
          }
        }
      },
    )

    test.skipIf(isBundledDev)(
      'direct CSS uses URLs relative to the stylesheet',
      async () => {
        const cssUrl = new URL(dir + 'from-js.css', viteTestUrl + '/')
        const response = await page.request.get(cssUrl.href, {
          headers: { accept: 'text/css' },
        })
        expect(response.ok()).toBe(true)
        const map = extractSourcemap(await response.text())
        expect([...map.sources].sort()).toEqual(files)
        for (const file of files) {
          expect(map.sourcesContent[map.sources.indexOf(file)]).toBe(
            readFile(dir + file),
          )
          const source = await page.request.get(new URL(file, cssUrl).href, {
            headers: { accept: 'text/css' },
          })
          expect(source.ok()).toBe(true)
          expect(await source.text()).toContain(
            file === 'dep.css' ? '.dep {' : '.from-js {',
          )
        }
      },
    )
  })
}
