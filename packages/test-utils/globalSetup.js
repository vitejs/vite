const os = require('os')
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright-chromium')

const DIR = path.join(os.tmpdir(), 'jest_playwright_global_setup')

module.exports = async () => {
  const browserServer = await chromium.launchServer({
    args: process.env.CI
      ? ['--no-sandbox', '--disable-setuid-sandbox']
      : undefined
  })

  global.__BROWSER_SERVER__ = browserServer

  fs.mkdirSync(DIR, { recursive: true })
  fs.writeFileSync(path.join(DIR, 'wsEndpoint'), browserServer.wsEndpoint())
}
