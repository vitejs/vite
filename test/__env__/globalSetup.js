const { chromium } = require('playwright-chromium')

module.exports = async () => {
  const browserServer = await chromium.launchServer({
    args: process.env.CI
      ? ['--no-sandbox', '--disable-setuid-sandbox']
      : undefined
  })

  global.__BROWSER_SERVER__ = browserServer
  process.__BROWSER_SESRVER_ENDPOINT__ = browserServer.wsEndpoint()
}
