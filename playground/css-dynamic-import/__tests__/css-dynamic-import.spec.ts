import type { InlineConfig } from 'vite'
import { build, createServer, preview } from 'vite'
import { expect, test } from 'vitest'
import { getColor, isBuild, isServe, page, ports, rootDir } from '~utils'

const baseOptions = [
  { base: '', label: 'relative' },
  { base: '/', label: 'absolute' },
]

const getConfig = (
  base: string,
  extra?: Partial<InlineConfig>,
): InlineConfig => ({
  base,
  root: rootDir,
  logLevel: 'silent',
  server: { port: ports['css/dynamic-import'] },
  preview: { port: ports['css/dynamic-import'] },
  build: { assetsInlineLimit: 0, ...extra?.build },
  ...extra,
})

async function withBuild(
  base: string,
  fn: () => Promise<void>,
  extra?: Partial<InlineConfig>,
) {
  const config = getConfig(base, extra)
  await build(config)
  const server = await preview(config)

  try {
    await page.goto(server.resolvedUrls.local[0])
    await fn()
  } finally {
    server.httpServer.close()
  }
}

async function withServe(base: string, fn: () => Promise<void>) {
  const config = getConfig(base)
  const server = await createServer(config)
  await server.listen()

  try {
    await page.goto(server.resolvedUrls.local[0])
    await fn()
  } finally {
    await page.goto('about:blank') // move to a different page to avoid auto-refresh after server start
    await server.close()
  }
}

async function getLinks() {
  const links = await page.$$('link')
  return await Promise.all(
    links.map((handle) => {
      return handle.evaluate((link) => ({
        pathname: new URL(link.href).pathname,
        rel: link.rel,
        as: link.as,
      }))
    }),
  )
}

baseOptions.forEach(({ base, label }) => {
  test.runIf(isBuild)(
    `doesn't duplicate dynamically imported css files when built with ${label} base`,
    async () => {
      await withBuild(base, async () => {
        await page.waitForSelector('.loaded', { state: 'attached' })

        expect(await getColor('.css-dynamic-import')).toBe('green')
        const linkUrls = (await getLinks()).map((link) => link.pathname)
        const uniqueLinkUrls = [...new Set(linkUrls)]
        expect(linkUrls).toStrictEqual(uniqueLinkUrls)
      })
    },
  )

  test.runIf(isServe)(
    `doesn't duplicate dynamically imported css files when served with ${label} base`,
    async () => {
      await withServe(base, async () => {
        await page.waitForSelector('.loaded', { state: 'attached' })

        expect(await getColor('.css-dynamic-import')).toBe('green')
        // in serve there is no preloading
        expect(await getLinks()).toEqual([
          {
            pathname: '/dynamic.css',
            rel: 'preload',
            as: 'style',
          },
        ])
      })
    },
  )
})

// Test: CSS from pure CSS chunks (via manualChunks) should preserve
// the original import order. When base.css is in a separate pure CSS
// chunk that was imported BEFORE page.css, base.css should appear
// before page.css in the cascade. This means page.css (green) should
// override base.css (red). (#3924, #6375)
test.runIf(isBuild)(
  'css order is preserved when pure css chunks are created via manualChunks',
  async () => {
    const path = await import('node:path')
    await withBuild(
      '/',
      async () => {
        await page.waitForSelector('.async-order-el', { state: 'attached' })
        // page.css (green) should override base.css (red) because
        // page.js imports base.js first (which brings in base.css),
        // then imports page.css — so page.css should come later in cascade
        expect(await getColor('.async-order-el')).toBe('green')
      },
      {
        build: {
          assetsInlineLimit: 0,
          rollupOptions: {
            output: {
              // Split base.css into its own chunk, creating a pure CSS chunk.
              // This reproduces the bug where CSS from pure CSS chunks ends up
              // after the importing chunk's own CSS in the cascade.
              manualChunks(id) {
                if (id.includes('async-order/base.css')) {
                  return 'async-base'
                }
              },
            },
          },
        },
      },
    )
  },
)
