import { URL } from 'node:url'
import { expect, test } from 'vitest'
import {
  extractSourcemap,
  formatSourcemapForSnapshot,
  isBuild,
  page,
} from '~utils'

test.runIf(!isBuild)('correct sourcemap', async () => {
  const res = await page.request.get(new URL('./foo.js', page.url()).href)
  const js = await res.text()
  expect(js).toContain('// add comment')
  const map = extractSourcemap(js)
  expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
    {
      "mappings": "AAAA,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;",
      "sources": [
        "foo.js",
      ],
      "sourcesContent": [
        "export const foo = 'foo'
    ",
      ],
      "version": 3,
    }
  `)
})
