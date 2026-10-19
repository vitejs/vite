import type { ManifestV1 } from 'vite'
import { expect, test } from 'vitest'
import { getColor, isBuild, page, readManifest } from '~utils'

test('preserves document transforms', async () => {
  expect(await page.title()).toBe('Transformed')
  expect(await page.getAttribute('meta[name="a"]', 'content')).toBe('"<&')
  expect(await page.locator('meta[name="document"]').count()).toBe(1)
  expect(await page.locator('meta[name="context"]').count()).toBe(0)
  await expect.poll(() => getColor('body')).toBe('red')
})

test.runIf(isBuild)(
  'emits the chunk map and tag groups in hook execution order',
  () => {
    const manifest = readManifest('new-manifest') as ManifestV1
    expect(manifest.version).toBe(1)
    expect(manifest.chunks['index.html']).toMatchObject({
      isEntry: true,
      css: [expect.stringMatching(/\.css$/)],
      assets: [expect.stringMatching(/\.svg$/)],
    })
    expect(manifest.htmlTags).toEqual([
      [
        {
          tag: 'meta',
          attrs: { name: 'a', content: '"<&' },
          injectTo: 'head-prepend',
        },
        {
          tag: 'meta',
          attrs: { name: 'b', hidden: true, disabled: false },
          injectTo: 'head-prepend',
        },
      ],
      [
        {
          tag: 'meta',
          attrs: { name: 'context', content: 'bundle' },
          injectTo: 'head-prepend',
        },
        {
          tag: 'meta',
          attrs: {
            name: 'bundle',
            content: expect.stringContaining(
              manifest.chunks['index.html'].file,
            ),
          },
          injectTo: 'head-prepend',
        },
      ],
      [
        {
          tag: 'noscript',
          injectTo: 'body',
          children: [{ tag: 'p', children: 'fallback' }],
        },
      ],
    ])
  },
)
