import { getColor } from '../../testUtils'
import { createServer } from 'vite'
import path from 'path'

test('postcss config', async () => {
  const port = 5005
  const startServer = async (root) => {
    const server = await createServer({
      root,
      logLevel: 'silent',
      server: {
        port,
        strictPort: true
      },
      build: {
        // skip transpilation during tests to make it faster
        target: 'esnext'
      }
    })
    await server.listen()
    return server
  }
  const blueAppDir = path.join(__dirname, 'blue-app')
  const greenAppDir = path.join(__dirname, 'green-app')
  let blueApp
  let greenApp
  try {
    blueApp = await startServer(blueAppDir)

    await page.goto(`http://localhost:${port}`)
    const blueA = await page.$('.postcss-a')
    expect(await getColor(blueA)).toBe('blue')
    const blueB = await page.$('.postcss-b')
    expect(await getColor(blueB)).toBe('black')
    await blueApp.close()
    blueApp = null

    greenApp = await startServer(greenAppDir)
    await page.goto(`http://localhost:${port}`)
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
