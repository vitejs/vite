import { resolve } from 'path'
import { createServer, ViteDevServer } from 'vite'
import { Page } from 'playwright-chromium'

declare global {
  const page: Page
}

export function setupPlaygroundTest(dir = '.') {
  let server: ViteDevServer

  beforeAll(async () => {
    const root = resolve(__dirname, '../packages/playground', dir)
    server = await (await createServer({ root })).listen()
    await page.goto(
      // use resolved port from server
      `http://localhost:${server.config.server.port}`
    )
  })

  afterAll(async () => {
    await server.close()
  })
}
