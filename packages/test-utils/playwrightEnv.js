const os = require('os')
const fs = require('fs')
const path = require('path')
const NodeEnvironment = require('jest-environment-node')
const { chromium } = require('playwright-chromium')

const DIR = path.join(os.tmpdir(), 'jest_playwright_global_setup')

module.exports = class PlaywrightEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config)
  }

  async setup() {
    await super.setup()
    const wsEndpoint = fs.readFileSync(path.join(DIR, 'wsEndpoint'), 'utf-8')
    if (!wsEndpoint) {
      throw new Error('wsEndpoint not found')
    }
    const browser = (this.browser = await chromium.connect({
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
    await this.browser.close()
    await super.teardown()
  }
}
