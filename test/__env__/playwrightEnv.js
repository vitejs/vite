const NodeEnvironment = require('jest-environment-node')
const { chromium } = require('playwright-chromium')

module.exports = class PlaywrightEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config)
  }

  async setup() {
    await super.setup()
    const wsEndpoint = process.__BROWSER_SESRVER_ENDPOINT__
    if (!wsEndpoint) {
      throw new Error('wsEndpoint not found')
    }
    const browser = (this.global.__BROWSER__ = await chromium.connect({
      wsEndpoint
    }))
    this.global.page = await browser.newPage()

    // suppress @vue/compiler-sfc warning
    const console = this.global.console
    const warn = console.warn
    console.warn = (msg, ...args) => {
      if (!msg.includes('@vue/compiler-sfc')) {
        warn.call(console, msg, ...args)
      }
    }
  }

  async teardown() {
    await super.teardown()
    await this.global.__BROWSER__.close()
  }
}
