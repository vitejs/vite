import path from 'node:path'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
import { getBgColor, getColor, isServe, page, ports } from '~utils'

// Regression test for https://github.com/vitejs/vite/issues/4000
test.runIf(isServe)('postcss plugins in different dir', async () => {
  const port = ports['css/postcss-plugins-different-dir']
  const server = await createServer({
    root: path.join(__dirname, '..', '..', '..', 'tailwind'),
    logLevel: 'silent',
    server: {
      port,
      strictPort: true,
    },
    build: {
      // skip transpilation during tests to make it faster
      target: 'esnext',
    },
  })
  await server.listen()
  try {
    await page.goto(`http://localhost:${port}`)
    const tailwindStyle = page.locator('#tailwind-style')
    expect(await getBgColor(tailwindStyle)).toBe('rgb(254, 226, 226)')
    expect(await getColor(tailwindStyle)).toBe('rgb(136, 136, 136)')
  } finally {
    await server.close()
  }
})
