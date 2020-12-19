import { resolve } from 'path'
import slash from 'slash'
import { createServer, ViteDevServer } from 'vite'
import { Page } from 'playwright-chromium'

declare global {
  const page: Page
}

export function setupTest(testDir: string) {
  let server: ViteDevServer

  beforeAll(async () => {
    const root = resolve(__dirname, '../playground')
    const configPath = resolve(root, 'vite.config.ts')
    const testName = slash(testDir).match(/playground\/(\w+)\//)?.[1]
    server = await (
      await createServer(
        {
          root,
          logLevel: 'error'
        },
        undefined,
        configPath
      )
    ).listen()
    await page.goto(
      // use resolved port from server
      `http://localhost:${server.config.server.port}/${
        testName ? `${testName}/` : ``
      }`
    )
  })

  afterAll(async () => {
    await server.close()
  })
}
