import type { InlineConfig } from 'vite'
import { build, createServer, preview } from 'vite'
import { expect, test } from 'vitest'
import { getColor, isBuild, isServe, page, ports, rootDir } from '~utils'

const baseOptions = [
  { base: '', label: 'relative' },
  { base: '/', label: 'absolute' },
]

const getConfig = (base: string): InlineConfig => ({
  base,
  root: rootDir,
  logLevel: 'silent',
  preview: { port: ports['css/dynamic-import'] },
  build: { assetsInlineLimit: 0 },
})

async function withBuild(base: string, fn: () => Promise<void>) {
  const config = getConfig(base)
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
  await new Promise((r) => setTimeout(r, 500))

  try {
    await page.goto(server.resolvedUrls.local[0])
    await fn()
  } finally {
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
        expect(await getLinks()).toEqual([
          {
            pathname: expect.stringMatching(/^\/assets\/index-.+\.css$/),
            rel: 'stylesheet',
            as: '',
          },
          {
            pathname: expect.stringMatching(/^\/assets\/dynamic-.+\.css$/),
            rel: 'preload',
            as: 'style',
          },
          {
            pathname: expect.stringMatching(/^\/assets\/dynamic-.+\.js$/),
            rel: 'modulepreload',
            as: 'script',
          },
          {
            pathname: expect.stringMatching(/^\/assets\/dynamic-.+\.css$/),
            rel: 'stylesheet',
            as: '',
          },
          {
            pathname: expect.stringMatching(/^\/assets\/static-.+\.js$/),
            rel: 'modulepreload',
            as: 'script',
          },
          {
            pathname: expect.stringMatching(/^\/assets\/index-.+\.js$/),
            rel: 'modulepreload',
            as: 'script',
          },
        ])
      })
    },
    { retry: 3 },
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
    { retry: 3 },
  )
})
