const fs = require('fs-extra')
const path = require('path')
const execa = require('execa')
const puppeteer = require('puppeteer')

jest.setTimeout(100000)

const timeout = (n) => new Promise((r) => setTimeout(r, n))

const binPath = path.resolve(__dirname, '../bin/vite.js')
const fixtureDir = path.join(__dirname, '../playground')
const tempDir = path.join(__dirname, 'temp')
let devServer
let browser
let page
const browserLogs = []
const serverLogs = []

const getEl = async (selectorOrEl) => {
  return typeof selectorOrEl === 'string'
    ? await page.$(selectorOrEl)
    : selectorOrEl
}

const getText = async (selectorOrEl) => {
  const el = await getEl(selectorOrEl)
  return el ? el.evaluate((el) => el.textContent) : null
}

const getComputedColor = async (selectorOrEl) => {
  return (await getEl(selectorOrEl)).evaluate(
    (el) => getComputedStyle(el).color
  )
}

const navigateFinish = async () => {
  return await page.waitForNavigation({
    waitUntil: 'domcontentloaded'
  })
}

beforeAll(async () => {
  try {
    await fs.remove(tempDir)
  } catch (e) {}
  await fs.copy(fixtureDir, tempDir, {
    filter: (file) => !/dist|node_modules/.test(file)
  })
})

afterAll(async () => {
  try {
    await fs.remove(tempDir)
  } catch (e) {}
  if (browser) await browser.close()
  if (devServer) {
    devServer.kill('SIGTERM', {
      forceKillAfterTimeout: 2000
    })
  }
  // console.log(browserLogs)
  // console.log(serverLogs)
})

describe('vite', () => {
  beforeAll(async () => {
    browser = await puppeteer.launch(
      process.env.CI
        ? { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
        : {}
    )
  })

  function declareTests(isBuild) {
    test('should render', async () => {
      expect(await getText('h1')).toMatch('Vite Playground')
    })

    test('should generate correct asset paths', async () => {
      const has404 = browserLogs.some((msg) => msg.match('404'))
      if (has404) {
        console.log(browserLogs)
      }
      expect(has404).toBe(false)
    })

    test('asset import from js', async () => {
      expect(await getText('.asset-import')).toMatch(
        isBuild
          ? // hashed in production
            /\/_assets\/testAssets\.([\w\d]+)\.png$/
          : // only resolved to absolute in dev
            '/testAssets.png'
      )
    })

    test('env variables', async () => {
      expect(await getText('.dev')).toMatch(`__DEV__: ${!isBuild}`)
      expect(await getText('.base')).toMatch(`__BASE__: /`)
      expect(await getText('.node_env')).toMatch(
        `process.env.NODE_ENV: ${isBuild ? 'production' : 'development'}`
      )
    })

    test('module resolving', async () => {
      expect(await getText('.module-resolve-router')).toMatch('ok')
      expect(await getText('.module-resolve-store')).toMatch('ok')
      expect(await getText('.module-resolve-optimize')).toMatch('ok')
      expect(await getText('.index-resolve')).toMatch('ok')
    })

    if (!isBuild) {
      test('hmr (vue re-render)', async () => {
        const button = await page.$('.hmr-increment')
        await button.click()
        expect(await getText(button)).toMatch('>>> 1 <<<')

        await updateFile('TestHmr.vue', (content) =>
          content.replace('{{ count }}', 'count is {{ count }}')
        )
        // note: using the same button to ensure the component did only re-render
        // if it's a reload, it would have replaced the button with a new one.
        await expectByPolling(() => getText(button), 'count is 1')
      })

      test('hmr (vue reload)', async () => {
        await updateFile('TestHmr.vue', (content) =>
          content.replace('count: 0,', 'count: 1337,')
        )
        await expectByPolling(() => getText('.hmr-increment'), 'count is 1337')
      })

      test('hmr (js -> vue propagation)', async () => {
        const span = await page.$('.hmr-propagation')
        expect(await getText(span)).toBe('1')
        await updateFile('testHmrPropagation.js', (content) =>
          content.replace('return 1', 'return 666')
        )
        await expectByPolling(() => getText('.hmr-propagation'), '666')
      })

      test('hmr (manual API, self accepting)', async () => {
        await updateFile('testHmrManual.js', (content) =>
          content.replace('foo = 1', 'foo = 2')
        )
        await expectByPolling(
          () => browserLogs[browserLogs.length - 1],
          'js module hot updated:  /testHmrManual.js'
        )
        expect(
          browserLogs.slice(browserLogs.length - 4, browserLogs.length - 1)
        ).toEqual([
          `foo was: 1`,
          `(self-accepting)1.foo is now: 2`,
          `(self-accepting)2.foo is now: 2`
        ])
      })

      test('hmr (manual API, accepting deps)', async () => {
        browserLogs.length = 0
        await updateFile('testHmrManualDep.js', (content) =>
          content.replace('foo = 1', 'foo = 2')
        )
        await expectByPolling(
          () => browserLogs[browserLogs.length - 1],
          'js module hot updated:  /testHmrManual.js'
        )
        expect(
          browserLogs.slice(browserLogs.length - 7, browserLogs.length - 1)
        ).toEqual([
          // dispose for both dep and self
          `foo was: 2`,
          `(dep) foo was: 1`,
          // self callbacks
          `(self-accepting)1.foo is now: 2`,
          `(self-accepting)2.foo is now: 2`,
          // dep callbacks
          `(single dep) foo is now: 2`,
          `(multiple deps) foo is now: 2`
        ])
      })
    }

    test('CSS import w/ PostCSS', async () => {
      const el = await page.$('.postcss-from-css')
      expect(await getComputedColor(el)).toBe('rgb(255, 0, 0)')
      // hmr
      if (!isBuild) {
        await updateFile('testPostCss.css', (content) =>
          content.replace('red', 'green')
        )
        await expectByPolling(() => getComputedColor(el), 'rgb(0, 128, 0)')
      }
    })

    test('SFC <style> w/ PostCSS', async () => {
      const el = await page.$('.postcss-from-sfc')
      expect(await getComputedColor(el)).toBe('rgb(0, 128, 0)')
      // hmr
      if (!isBuild) {
        await updateFile('TestPostCss.vue', (content) =>
          content.replace('color: green;', 'color: red;')
        )
        await expectByPolling(() => getComputedColor(el), 'rgb(255, 0, 0)')
      }
    })

    test('SFC <style scoped>', async () => {
      const el = await page.$('.style-scoped')
      expect(await getComputedColor(el)).toBe('rgb(138, 43, 226)')
      if (!isBuild) {
        await updateFile('TestScopedCss.vue', (content) =>
          content.replace('rgb(138, 43, 226)', 'rgb(0, 0, 0)')
        )
        await expectByPolling(() => getComputedColor(el), 'rgb(0, 0, 0)')
      }
    })

    test('SFC <style module>', async () => {
      const el = await page.$('.css-modules-sfc')
      expect(await getComputedColor(el)).toBe('rgb(0, 0, 255)')
      if (!isBuild) {
        await updateFile('TestCssModules.vue', (content) =>
          content.replace('color: blue;', 'color: rgb(0, 0, 0);')
        )
        // css module results in component reload so must use fresh selector
        await expectByPolling(
          () => getComputedColor('.css-modules-sfc'),
          'rgb(0, 0, 0)'
        )
      }
    })

    test('import *.module.css', async () => {
      const el = await page.$('.css-modules-import')
      expect(await getComputedColor(el)).toBe('rgb(255, 140, 0)')
      if (!isBuild) {
        await updateFile('testCssModules.module.css', (content) =>
          content.replace('rgb(255, 140, 0)', 'rgb(0, 0, 1)')
        )
        // css module results in component reload so must use fresh selector
        await expectByPolling(
          () => getComputedColor('.css-modules-import'),
          'rgb(0, 0, 1)'
        )
      }
    })

    test('pre-processors', async () => {
      expect(await getText('.pug')).toMatch('template lang="pug"')
      expect(await getComputedColor('.pug')).toBe('rgb(255, 0, 255)')
      if (!isBuild) {
        await updateFile('TestPreprocessors.vue', (c) =>
          c.replace('$color: magenta', '$color: black')
        )
        await expectByPolling(() => getComputedColor('.pug'), 'rgb(0, 0, 0)')
        await updateFile('TestPreprocessors.vue', (c) =>
          c.replace('rendered from', 'pug with hmr')
        )
        await expectByPolling(() => getText('.pug'), 'pug with hmr')
      }
    })

    test('SFC src imports', async () => {
      expect(await getText('.src-imports-script')).toMatch('src="./script.ts"')
      const el = await getEl('.src-imports-style')
      expect(await getComputedColor(el)).toBe('rgb(119, 136, 153)')
      if (!isBuild) {
        // test style first, should not reload the component
        await updateFile('src-import/style.css', (c) =>
          c.replace('rgb(119, 136, 153)', 'rgb(0, 0, 0)')
        )
        await expectByPolling(() => getComputedColor(el), 'rgb(0, 0, 0)')
        // script
        await updateFile('src-import/script.ts', (c) =>
          c.replace('hello', 'bye')
        )
        await expectByPolling(() => getText('.src-imports-script'), 'bye from')
        // template
        await updateFile('src-import/template.html', (c) =>
          c.replace('{{ msg }}', '{{ msg }} changed')
        )
        await expectByPolling(() => getText('.src-imports-script'), 'changed')
      }
    })

    test('json', async () => {
      expect(await getText('.json')).toMatch('this is json')
      if (!isBuild) {
        await updateFile('testJsonImport.json', (c) =>
          c.replace('this is json', 'with hmr')
        )
        await expectByPolling(() => getText('.json'), 'with hmr')
      }
    })

    test('typescript', async () => {
      expect(await getText('.ts-self')).toMatch('from ts')
      expect(await getText('.ts-import')).toMatch('1')
      if (!isBuild) {
        await updateFile('ts/TestTs.vue', (c) =>
          c.replace(`m: string = 'from ts'`, `m: number = 123`)
        )
        await expectByPolling(() => getText('.ts-self'), '123')

        await updateFile('ts/testTs.ts', (c) =>
          c.replace(`n: number = 1`, `n: number = 2`)
        )
        await expectByPolling(() => getText('.ts-import'), '2')
      }
    })

    test('jsx', async () => {
      const text = await getText('.jsx-root')
      expect(text).toMatch('from Preact JSX')
      expect(text).toMatch('from Preact TSX')
      expect(text).toMatch('count is 1337')
      if (!isBuild) {
        await updateFile('testJsx.jsx', (c) => c.replace('1337', '2046'))
        await expectByPolling(() => getText('.jsx-root'), '2046')
      }
    })

    test('alias', async () => {
      expect(await getText('.alias')).toMatch('alias works')
      if (!isBuild) {
        await updateFile('aliased/index.js', (c) =>
          c.replace('works', 'hmr works')
        )
        await expectByPolling(() => getText('.alias'), 'alias hmr works')
      }
    })

    test('transforms', async () => {
      const el = await getEl('.transform-scss')
      expect(await getComputedColor(el)).toBe('rgb(0, 255, 255)')
      expect(await getText('.transform-js')).toBe('2')
      if (!isBuild) {
        await updateFile('testTransform.scss', (c) =>
          c.replace('cyan', 'rgb(0, 0, 0)')
        )
        await expectByPolling(() => getComputedColor(el), 'rgb(0, 0, 0)')
        await updateFile('testTransform.js', (c) => c.replace('= 1', '= 2'))
        await expectByPolling(() => getText('.transform-js'), '3')
      }
    })

    test('async component', async () => {
      await expectByPolling(() => getText('.async'), 'should show up')
    })
  }

  // test build first since we are going to edit the fixtures when testing dev
  describe('build', () => {
    let staticServer
    beforeAll(async () => {
      const buildOutput = await execa(binPath, ['build'], {
        cwd: tempDir
      })
      expect(buildOutput.stdout).toMatch('Build completed')
      expect(buildOutput.stderr).toBe('')
    })

    afterAll(() => {
      if (staticServer) staticServer.close()
    })

    describe('assertions', () => {
      beforeAll(async () => {
        // start a static file server
        const app = new (require('koa'))()
        app.use(require('koa-static')(path.join(tempDir, 'dist')))
        staticServer = require('http').createServer(app.callback())
        await new Promise((r) => staticServer.listen(3001, r))

        page = await browser.newPage()
        await page.goto('http://localhost:3001')
      })

      declareTests(true)
    })
  })

  describe('dev', () => {
    beforeAll(async () => {
      browserLogs.length = 0
      // start dev server
      devServer = execa(binPath, {
        cwd: tempDir
      })
      await new Promise((resolve) => {
        devServer.stdout.on('data', (data) => {
          serverLogs.push(data.toString())
          if (data.toString().match('running')) {
            resolve()
          }
        })
      })

      page = await browser.newPage()
      page.on('console', (msg) => {
        browserLogs.push(msg.text())
      })
      await page.goto('http://localhost:3000')
    })

    declareTests(false)

    test('hmr (index.html full-reload)', async () => {
      expect(await getText('title')).toMatch('Vite App')
      // hmr
      await updateFile('index.html', (content) =>
        content.replace('Vite App', 'Vite App Test')
      )
      await navigateFinish()
      await expectByPolling(() => getText('title'), 'Vite App Test')
    })

    test('hmr (html full-reload)', async () => {
      await page.goto('http://localhost:3000/test.html')
      expect(await getText('title')).toMatch('Vite App')
      // hmr
      await updateFile('test.html', (content) =>
        content.replace('Vite App', 'Vite App Test')
      )
      await navigateFinish()
      await expectByPolling(() => getText('title'), 'Vite App Test')
    })

    // Assert that all edited files are reflected on page reload
    // i.e. service-worker cache is correctly busted
    test('sw cache busting', async () => {
      await page.reload()

      expect(await getText('.hmr-increment')).toMatch('>>> count is 1337 <<<')
      expect(await getText('.hmr-propagation')).toMatch('666')
      expect(await getComputedColor('.postcss-from-css')).toBe('rgb(0, 128, 0)')
      expect(await getComputedColor('.postcss-from-sfc')).toBe('rgb(255, 0, 0)')
      expect(await getComputedColor('.style-scoped')).toBe('rgb(0, 0, 0)')
      expect(await getComputedColor('.css-modules-sfc')).toBe('rgb(0, 0, 0)')
      expect(await getComputedColor('.css-modules-import')).toBe('rgb(0, 0, 1)')
      expect(await getComputedColor('.pug')).toBe('rgb(0, 0, 0)')
      expect(await getText('.pug')).toMatch('pug with hmr')
      expect(await getComputedColor('.src-imports-style')).toBe('rgb(0, 0, 0)')
      expect(await getText('.src-imports-script')).toMatch('bye from')
      expect(await getText('.src-imports-script')).toMatch('changed')
      expect(await getText('.jsx-root')).toMatch('2046')
      expect(await getText('.alias')).toMatch('alias hmr works')
      expect(await getComputedColor('.transform-scss')).toBe('rgb(0, 0, 0)')
      expect(await getText('.transform-js')).toMatch('3')
      expect(await getText('.json')).toMatch('with hmr')

      // ensure import graph is still working
      await updateFile('testJsonImport.json', (c) =>
        c.replace('with hmr', 'with sw reload')
      )
      await expectByPolling(() => getText('.json'), 'with sw reload')
    })
  })
})

async function updateFile(file, replacer) {
  const compPath = path.join(tempDir, file)
  const content = await fs.readFile(compPath, 'utf-8')
  await fs.writeFile(compPath, replacer(content))
}

// poll until it updates
async function expectByPolling(poll, expected) {
  const maxTries = 20
  for (let tries = 0; tries < maxTries; tries++) {
    const actual = (await poll()) || ''
    if (actual.indexOf(expected) > -1 || tries === maxTries - 1) {
      expect(actual).toMatch(expected)
      break
    } else {
      await timeout(50)
    }
  }
}
