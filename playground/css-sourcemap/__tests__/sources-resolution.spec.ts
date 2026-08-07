import { URL } from 'node:url'
import { describe, expect, test } from 'vitest'
import {
  extractSourcemap,
  isBundledDev,
  isServe,
  page,
  testDir,
  viteTestUrl,
} from '~utils'

// Reproduction: a `sources` entry is a URL reference resolved against the
// map's location, but the emitted names use other bases. These tests assert
// the desired behavior. With the postcss transformer (this file), the
// "no filesystem paths" test fails on main: style-tag maps embed absolute
// local paths. They resolve today only because the dev server serves in-root
// files at their filesystem path; the same shape breaks for out-of-root
// files and leaks the machine's directory layout.
// The lightningcss twin of this file fails the two resolution tests instead.
describe.runIf(isServe)('css sourcemap sources', () => {
  const fetchResolved = async (source: string, base: string) => {
    const res = await page.request.get(new URL(source, base).href)
    return res.text()
  }

  const getStyleTagMap = async () => {
    let css: string | undefined
    for (const style of await page.$$('style')) {
      const text = await style.textContent()
      if (text?.includes('.from-js ')) css = text
    }
    expect(css).toBeDefined()
    return extractSourcemap(css!)
  }

  // bundled dev does not serve css at its own URL at all, so this case
  // only exists in unbundled dev
  test.skipIf(isBundledDev)(
    'URL-served css: sources resolve against the css URL',
    async () => {
      const cssUrl = new URL('./nested/dir/from-js.css', viteTestUrl + '/').href
      const res = await page.request.get(cssUrl, {
        headers: { accept: 'text/css' },
      })
      const map = extractSourcemap(await res.text())

      const resolved = await Promise.all(
        map.sources.map((source: string) => fetchResolved(source, cssUrl)),
      )
      expect(resolved.join('\n')).toContain('.from-js {')
      expect(resolved.join('\n')).toContain('.dep {')
    },
  )

  test('style tag: sources do not contain filesystem paths', async () => {
    await page.goto(viteTestUrl + '/')
    const map = await getStyleTagMap()
    for (const source of map.sources) {
      expect(source).not.toContain(testDir)
    }
  })

  // bundled dev serves only the bundle assets, never modules at their own
  // URLs, so source names cannot be fetched there regardless of their shape
  test.skipIf(isBundledDev)(
    'style tag: sources resolve from the root page and a nested page',
    async () => {
      for (const pagePath of ['/', '/admin/index.html']) {
        await page.goto(new URL('.' + pagePath, viteTestUrl + '/').href)
        const map = await getStyleTagMap()

        // the map lives in a style tag, so its base is the hosting page
        for (const source of map.sources) {
          const rule = source.includes('dep.css') ? '.dep {' : '.from-js {'
          const body = await fetchResolved(source, page.url())
          expect(
            body,
            `source "${source}" resolved from page ${pagePath}`,
          ).toContain(rule)
        }
      }
    },
  )
})
