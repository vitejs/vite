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

  test('json data import', async () => {
    const jsonComp = await page.$('.json')
    expect(await jsonComp.evaluate((e) => e.textContent)).toBe('hello world')
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

    const button = await page.$('button')
    await testByPolling('count is 1', () => {
      return button.evaluate((b) => b.textContent)
    })
  })

  test('import plain css', async () => {
    const child = await page.$('.child')
    const color = await child.evaluate((e) => {
      return window.getComputedStyle(e).color
    })
    expect(color).toBe('rgb(79, 192, 141)')
  })

  test('style hmr', async () => {
    const stylePath = path.join(tempDir, 'main.css')
    const content = await fs.readFile(stylePath, 'utf-8')
    await fs.writeFile(
      stylePath,
      content.replace('color: #4fc08d', 'color: red')
    )

    const child = await page.$('.child')
    await testByPolling('rgb(255, 0, 0)', () => {
      return child.evaluate((e) => getComputedStyle(e).color)
    })
  })

  // TODO test node_modules resolution
})

// poll until it updates
async function testByPolling(expectValue, poll) {
  const maxTries = 10
  for (let tries = 0; tries < maxTries; tries++) {
    const actual = await poll()
    if (actual === expectValue || tries === maxTries - 1) {
      expect(actual).toBe(expectValue)
    } else {
      await timeout(200)
    }
  }
}
