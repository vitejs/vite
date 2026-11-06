import { describe, expect, test } from 'vitest'
import { bundledDevUnsupported, isServe, page, viteTestUrl } from '~utils'
import { tests } from '../commonTests'

tests()

describe.runIf(isServe)(
  'extended filesystem checks',
  bundledDevUnsupported(
    'bundled dev does not serve individual project modules',
  ),
  () => {
    for (const extension of ['js', 'svg']) {
      test(`allows a path-based virtual ${extension} module through fs.allow`, async () => {
        const response = await page.request.fetch(
          `${viteTestUrl}/virtual.${extension}?import`,
        )

        expect(response.status()).toBe(200)
        expect(await response.text()).toContain("export default '<svg>")
      })

      test(`blocks an unallowed path-based virtual ${extension} module`, async () => {
        const response = await page.request.fetch(
          `${viteTestUrl}/denied.${extension}?import`,
        )

        expect(response.status()).toBe(404)
      })
    }
  },
)
