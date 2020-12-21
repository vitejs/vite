const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const { chromium } = require('playwright-chromium')

const DIR = path.join(os.tmpdir(), 'jest_playwright_global_setup')

module.exports = async () => {
  const browserServer = await chromium.launchServer({
    headless: !process.env.VITE_DEBUG_SERVE,
    args: process.env.CI
      ? ['--no-sandbox', '--disable-setuid-sandbox']
      : undefined
  })

  global.__BROWSER_SERVER__ = browserServer

  await fs.mkdirp(DIR)
  await fs.writeFile(path.join(DIR, 'wsEndpoint'), browserServer.wsEndpoint())
  await fs.remove(path.resolve(__dirname, '../temp'))
}
