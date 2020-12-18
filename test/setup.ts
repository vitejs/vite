import { resolve } from 'path'
import { createServer, ViteDevServer } from 'vite'
import { chromium, ChromiumBrowser, Page } from 'playwright-chromium'

declare global {
  namespace NodeJS {
    interface Global {
      browser: ChromiumBrowser
      server: ViteDevServer
      page: Page
    }
  }
}

export function setupPlaygroundTest(testDir: string) {
  const playgroundRoot = resolve(__dirname, '../packages/playground')
  const serverRoot = resolve(playgroundRoot, testDir)

  beforeAll(async () => {
    console.log(`starting server in ${serverRoot}`)

    const [server, browser] = await Promise.all([
      (
        await createServer({
          root: serverRoot
        })
      ).listen(),
      chromium.launch({
        args: process.env.CI
          ? ['--no-sandbox', '--disable-setuid-sandbox']
          : undefined
      })
    ])

    global.server = server
    global.browser = browser
    global.page = await browser.newPage()
    await global.page.goto(`http://localhost:${server.config.server.port}`)
  })

  afterAll(async () => {
    await global.browser.close()
    await global.server.close()
  })
}
