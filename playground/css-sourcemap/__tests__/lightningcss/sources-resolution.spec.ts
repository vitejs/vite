import { URL } from 'node:url'
import { describe, expect, test } from 'vitest'
import {
  extractSourcemap,
  isBundledDev,
  isServe,
  page,
  viteTestUrl,
} from '~utils'

// Shape 3 (#23195): lightningcss URL-served maps keep root-relative `sources`
// unless transformRequest rewrites them relative to the css file URL.
describe.runIf(isServe)('css sourcemap sources', () => {
  const fetchResolved = async (source: string, base: string) => {
    const res = await page.request.get(new URL(source, base).href)
    return res.text()
  }

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
})
