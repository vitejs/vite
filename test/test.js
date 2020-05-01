const fs = require('fs').promises
const path = require('path')
const execa = require('execa')
const puppeteer = require('puppeteer')

const timeout = (n) => new Promise((r) => setTimeout(r, n))

const fixtureDir = path.join(__dirname, 'fixtures')
const tempDir = path.join(__dirname, 'temp')
let server
let browser

jest.setTimeout(100000)

beforeAll(async () => {
  await fs.rmdir(tempDir, { recursive: true })
  await fs.mkdir(tempDir)
  for (const file of await fs.readdir(fixtureDir)) {
    await fs.copyFile(
      path.join(__dirname, 'fixtures', file),
      path.join(tempDir, file)
    )
  }
})

afterAll(async () => {
  await fs.rmdir(tempDir, { recursive: true })
  if (browser) await browser.close()
  if (server)
    server.kill('SIGTERM', {
      forceKillAfterTimeout: 2000
    })
})

describe('vite', () => {
  let page

  beforeAll(async () => {
    server = execa(path.resolve(__dirname, '../bin/vite.js'), {
      cwd: tempDir
    })
    await new Promise((resolve) => {
      server.stdout.on('data', (data) => {
        if (data.toString().match('running')) {
          resolve()
        }
      })
    })

    browser = await puppeteer.launch(
      process.env.CI
        ? { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
        : {}
    )

    page = await browser.newPage()
    await page.goto('http://localhost:3000')
  })

  test('nested components rendering', async () => {
    const button = await page.$('button')
    expect(await button.evaluate((b) => b.textContent)).toBe('0')
    const child = await page.$('.child')
    expect(await child.evaluate((e) => e.textContent)).toBe('This is child')
  })

  test('interaction', async () => {
    const button = await page.$('button')
    await button.click()
    expect(await button.evaluate((b) => b.textContent)).toBe('1')
  })

  test('hmr', async () => {
    const compPath = path.join(tempDir, 'Comp.vue')
    const content = await fs.readFile(compPath, 'utf-8')
    await fs.writeFile(
      compPath,
      content.replace('{{ count }}', 'count is {{ count }}')
    )

    // poll until it updates
    const button = await page.$('button')
    const maxTries = 10
    for (let tries = 0; tries < maxTries; tries++) {
      const text = await button.evaluate((b) => b.textContent)
      if (text === 'count is 1' || tries === maxTries - 1) {
        expect(text).toBe('count is 1')
      } else {
        await timeout(200)
      }
    }
  })

  // TODO test style HMR
  // TODO test node_modules resolution
})
