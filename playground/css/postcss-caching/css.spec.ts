import path from 'node:path'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
import { getColor, isServe, page, ports } from '~utils'

test.runIf(isServe)('postcss config', async () => {
  const port = ports['css/postcss-caching']
  const startServer = async (root) => {
    const server = await createServer({
      root,
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
    return server
  }

  const blueAppDir = path.join(__dirname, 'blue-app')
  const greenAppDir = path.join(__dirname, 'green-app')
  let blueApp
  let greenApp
  try {
    const hmrConnectionPromise = page.waitForEvent('console', (msg) =>
      msg.text().includes('connected'),
    )

    blueApp = await startServer(blueAppDir)

    await page.goto(`http://localhost:${port}`, { waitUntil: 'load' })
    const blueA = await page.$('.postcss-a')
    expect(await getColor(blueA)).toBe('blue')
    const blueB = await page.$('.postcss-b')
    expect(await getColor(blueB)).toBe('black')

    // wait for hmr connection because: if server stops before connection, auto reload does not happen
    await hmrConnectionPromise
    await blueApp.close()
    blueApp = null

    const loadPromise = page.waitForEvent('load') // wait for server restart auto reload
    greenApp = await startServer(greenAppDir)
    await loadPromise

    const greenA = await page.$('.postcss-a')
    expect(await getColor(greenA)).toBe('black')
    const greenB = await page.$('.postcss-b')
    expect(await getColor(greenB)).toBe('green')
    await greenApp.close()
    greenApp = null
  } finally {
    if (blueApp) {
      await blueApp.close()
    }
    if (greenApp) {
      await greenApp.close()
    }
  }
})
