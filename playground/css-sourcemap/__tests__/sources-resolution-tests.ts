import { describe, expect, test } from 'vitest'
import {
  extractSourcemap,
  isBundledDev,
  isServe,
  page,
  viteTestUrl,
} from '~utils'

export function testCssSourcemapSources() {
  describe.runIf(isServe)('css sourcemap sources', () => {
    const baseUrl = () =>
      viteTestUrl.endsWith('/') ? viteTestUrl : viteTestUrl + '/'
    const cssUrl = () => new URL('./nested/dir/from-js.css', baseUrl()).href

    test.skipIf(isBundledDev)(
      'URL-served sources resolve against the CSS URL',
      async () => {
        const response = await page.request.get(cssUrl(), {
          headers: { accept: 'text/css' },
        })
        const map = extractSourcemap(await response.text())
        expect([...map.sources].sort()).toEqual(['dep.css', 'from-js.css'])

        for (const source of map.sources) {
          const response = await page.request.get(
            new URL(source, cssUrl()).href,
          )
          expect(response.ok()).toBe(true)
          expect(await response.text()).toContain(
            source === 'dep.css' ? '.dep {' : '.from-js {',
          )
        }
      },
    )

    test('style tag sources resolve independently of the hosting page', async () => {
      const expectedSources = ['dep.css', 'from-js.css']
        .map((source) => new URL(source, cssUrl()).pathname)
        .sort()
      for (const pagePath of ['./', './admin/index.html']) {
        await page.goto(new URL(pagePath, baseUrl()).href)
        const css = await page
          .locator('style')
          .evaluateAll((styles) =>
            styles
              .map((style) => style.textContent)
              .find((css) => css?.includes('.from-js ')),
          )
        expect(css).toBeDefined()
        const map = extractSourcemap(css!)
        expect([...map.sources].sort()).toEqual(expectedSources)
        expect(map.sourcesContent).toHaveLength(2)

        // Bundled dev serves bundle assets instead of the original modules.
        if (!isBundledDev) {
          for (const source of map.sources) {
            const response = await page.request.get(
              new URL(source, page.url()).href,
            )
            expect(response.ok()).toBe(true)
            expect(await response.text()).toContain(
              source.endsWith('/dep.css') ? '.dep {' : '.from-js {',
            )
          }
        }
      }
    })
  })
}
