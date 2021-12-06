// @ts-check
import os from 'os'
import fs from 'fs-extra'
import path from 'path'
import { chromium } from 'playwright-chromium'

const DIR = path.join(os.tmpdir(), 'jest_playwright_global_setup')

let browser

export async function mochaGlobalSetup() {
  const tempDir = path.resolve(__dirname, '../packages/temp')
  await fs.remove(tempDir)
  await fs.copy(path.resolve(__dirname, '../packages/playground'), tempDir, {
    dereference: false,
    filter(file) {
      file = file.replace(/\\/g, '/')
      return !file.includes('__tests__') && !file.match(/dist(\/|$)/)
    }
  })

  browser = await chromium.launchServer({
    headless: !process.env.VITE_DEBUG_SERVE,
    args: process.env.CI
      ? ['--no-sandbox', '--disable-setuid-sandbox']
      : undefined
  })

  await fs.mkdirp(DIR)
  await fs.writeFile(path.join(DIR, 'wsEndpoint'), browser.wsEndpoint())
}

export async function mochaGlobalTeardown() {
  await browser?.close()

  if (!process.env.VITE_PRESERVE_BUILD_ARTIFACTS) {
    await fs.remove(path.resolve(__dirname, '../packages/temp'))
  }
}
