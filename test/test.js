const fs = require('fs-extra')
const path = require('path')
const execa = require('execa')
const puppeteer = require('puppeteer')
const moment = require('moment')

jest.setTimeout(100000)

const timeout = (n) => new Promise((r) => setTimeout(r, n))

const binPath = path.resolve(__dirname, '../bin/vite.js')
const fixtureDir = path.join(__dirname, '../playground')
const tempDir = path.join(__dirname, '../temp')
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

const click = async (selectorOrEl) => {
  const el = await getEl(selectorOrEl)
  await el.click()
}

beforeAll(async () => {
  try {
    await fs.remove(tempDir)
  } catch (e) {}
  await fs.copy(fixtureDir, tempDir, {
    filter: (file) => !/dist|node_modules/.test(file)
  })
  await execa('yarn', { cwd: tempDir })
  await execa('yarn', { cwd: path.join(tempDir, 'optimize-linked') })
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
      const mode = isBuild ? 'production' : 'development'

      expect(await getText('.base')).toMatch(`BASE_URL: /`)
      expect(await getText('.mode')).toMatch(`MODE: ${mode}`)
      expect(await getText('.dev')).toMatch(`DEV: ${!isBuild}`)
      expect(await getText('.prod')).toMatch(`PROD: ${isBuild}`)
      expect(await getText('.custom-env-variable')).toMatch(
        'VITE_CUSTOM_ENV_VARIABLE: 9527'
      )
      expect(await getText('.effective-mode-file-name')).toMatch(
        `VITE_EFFECTIVE_MODE_FILE_NAME: ${
          isBuild ? `.env.production` : `.env.development`
        }`
      )

      expect(await getText('.node-env')).toMatch(`NODE_ENV: ${mode}`)
    })

    test('module resolving', async () => {
      expect(await getText('.module-resolve-router')).toMatch('ok')
      expect(await getText('.module-resolve-store')).toMatch('ok')
      expect(await getText('.module-resolve-optimize')).toMatch('ok')
      expect(await getText('.index-resolve')).toMatch('ok')
      expect(await getText('.dot-resolve')).toMatch('ok')
      expect(await getText('.browser-field-resolve')).toMatch('ok')
      expect(await getText('.css-entry-resolve')).toMatch('ok')
    })

    if (!isBuild) {
      test('hmr (vue re-render)', async () => {
        const button = await page.$('.hmr-increment')
        await button.click()
        expect(await getText(button)).toMatch('>>> 1 <<<')

        await updateFile('hmr/TestHmr.vue', (content) =>
          content.replace('{{ count }}', 'count is {{ count }}')
        )
        // note: using the same button to ensure the component did only re-render
        // if it's a reload, it would have replaced the button with a new one.
        await expectByPolling(() => getText(button), 'count is 1')
      })

      test('hmr (vue reload)', async () => {
        await updateFile('hmr/TestHmr.vue', (content) =>
          content.replace('count: 0,', 'count: 1337,')
        )
        await expectByPolling(() => getText('.hmr-increment'), 'count is 1337')
      })

      test('hmr (js -> vue propagation)', async () => {
        const span = await page.$('.hmr-propagation')
        expect(await getText(span)).toBe('1')
        await updateFile('hmr/testHmrPropagation.js', (content) =>
          content.replace('return 1', 'return 666')
        )
        await expectByPolling(() => getText('.hmr-propagation'), '666')
      })

      test('hmr (js -> vue propagation. dynamic import, static-analyzable)', async () => {
        let span = await page.$('.hmr-propagation-dynamic')
        expect(await getText(span)).toBe('bar not loaded')
        // trigger the dynamic import
        await click('.hmr-propagation-dynamic-load')
        expect(await getText(span)).toBe('bar loading')
        await expectByPolling(() => getText(span), 'bar loaded')
        // update source code
        await updateFile('hmr/testHmrPropagationDynamicImport.js', (content) =>
          content.replace('bar loaded', 'bar updated')
        )
        // the update trigger the reload of TestHmr component
        // all states in it are lost
        await expectByPolling(
          () => getText('.hmr-propagation-dynamic'),
          'bar not loaded'
        )
        span = await page.$('.hmr-propagation-dynamic')
        await click('.hmr-propagation-dynamic-load')
        expect(await getText(span)).toBe('bar loading')
        await expectByPolling(() => getText(span), 'bar updated')
      })

      test('hmr (js -> vue propagation. full dynamic import, non-static-analyzable)', async () => {
        let span = await page.$('.hmr-propagation-full-dynamic')
        expect(await getText(span)).toBe('baz not loaded')
        // trigger the dynamic import
        await click('.hmr-propagation-full-dynamic-load')
        expect(await getText(span)).toBe('baz loading')
        await expectByPolling(() => getText(span), 'baz loaded')
        // update source code
        await updateFile(
          'hmr/testHmrPropagationFullDynamicImport.js',
          (content) => content.replace('baz loaded', 'baz updated')
        )
        // the update doesn't trigger hmr
        // because it is a non-static-analyzable dynamic import
        // and the imported file is not self-accepting
        await timeout(200)
        expect(await getText('.hmr-propagation-full-dynamic')).toBe(
          'baz loaded'
        )
        // only if we reload the whole page, we can see the new content
        await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] })
        span = await page.$('.hmr-propagation-full-dynamic')
        expect(await getText(span)).toBe('baz not loaded')
        // trigger the dynamic import
        await click('.hmr-propagation-full-dynamic-load')
        expect(await getText(span)).toBe('baz loading')
        await expectByPolling(() => getText(span), 'baz updated')
      })

      test('hmr (js -> vue propagation. full dynamic import, non-static-analyzable, but self-accepting)', async () => {
        // reset the sate
        await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] })
        let stateIncrementButton = await page.$('.hmr-increment')
        await stateIncrementButton.click()
        expect(await getText(stateIncrementButton)).toMatch(
          '>>> count is 1338 <<<'
        )

        let span = await page.$('.hmr-propagation-full-dynamic-self-accepting')
        expect(await getText(span)).toBe('qux not loaded')
        // trigger the dynamic import
        await click('.hmr-propagation-full-dynamic-load-self-accepting')
        expect(await getText(span)).toBe('qux loading')
        await expectByPolling(() => getText(span), 'qux loaded')
        // update source code
        await updateFile(
          'hmr/testHmrPropagationFullDynamicImportSelfAccepting.js',
          (content) => content.replace('qux loaded', 'qux updated')
        )
        // the update is accepted by the imported file
        await expectByPolling(() => getText(span), 'qux updated')
        // the state should be the same
        // because the TestHmr component is not reloaded
        stateIncrementButton = await page.$('.hmr-increment')
        expect(await getText(stateIncrementButton)).toMatch(
          '>>> count is 1338 <<<'
        )
      })

      test('hmr (manual API, self accepting)', async () => {
        await updateFile('hmr/testHmrManual.js', (content) =>
          content.replace('foo = 1', 'foo = 2')
        )
        await expectByPolling(
          () => browserLogs[browserLogs.length - 1],
          'js module hot updated:  /hmr/testHmrManual.js'
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
        await updateFile('hmr/testHmrManualDep.js', (content) =>
          content.replace('foo = 1', 'foo = 2')
        )
        await expectByPolling(
          () => browserLogs[browserLogs.length - 1],
          'js module hot updated:  /hmr/testHmrManual.js'
        )
        expect(
          browserLogs.slice(browserLogs.length - 8, browserLogs.length - 1)
        ).toEqual([
          // dispose for both dep and self
          `foo was: 2`,
          `(dep) foo was: 1`,
          `(dep) foo from dispose: 10`,
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
        await updateFile('css/testPostCss.css', (content) =>
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
        await updateFile('css/TestPostCss.vue', (content) =>
          content.replace('color: green;', 'color: red;')
        )
        await expectByPolling(() => getComputedColor(el), 'rgb(255, 0, 0)')
      }
    })

    if (!isBuild) {
      test('hmr (style @import bail to <style>)', async () => {
        // external imports are preserved, and is not supported with constructed
        // CSSStyleSheet, so we need to remove the constructed sheet and fallback
        // to <style> insertion
        const externalImport = `@import 'http://localhost:3000/css/empty.css';`
        await updateFile('css/TestPostCss.vue', (content) => {
          return content
            .replace(`<style>`, `<style>\n${externalImport}\n`)
            .replace('color: red;', 'color: green;')
        })
        // should work
        await expectByPolling(
          () => getComputedColor('.postcss-from-sfc'),
          'rgb(0, 128, 0)'
        )
        await updateFile('css/TestPostCss.vue', (content) => {
          return content
            .replace(externalImport, '')
            .replace('color: green;', 'color: red;')
        })
        // should work
        await expectByPolling(
          () => getComputedColor('.postcss-from-sfc'),
          'rgb(255, 0, 0)'
        )
      })

      test('hmr (style removal)', async () => {
        await updateFile('css/TestPostCss.vue', (content) =>
          content.replace(/<style>(.|\s)*<\/style>/, ``)
        )
        await expectByPolling(
          () => getComputedColor('.postcss-from-sfc'),
          'rgb(0, 0, 0)'
        )
      })
    }

    test('SFC <style scoped>', async () => {
      const el = await page.$('.style-scoped')
      expect(await getComputedColor(el)).toBe('rgb(138, 43, 226)')
      if (!isBuild) {
        await updateFile('css/TestScopedCss.vue', (content) =>
          content.replace('rgb(138, 43, 226)', 'rgb(0, 0, 0)')
        )
        await expectByPolling(() => getComputedColor(el), 'rgb(0, 0, 0)')
      }
    })

    test('SFC <style module>', async () => {
      const el = await page.$('.css-modules-sfc')
      expect(await getComputedColor(el)).toBe('rgb(0, 0, 255)')
      if (!isBuild) {
        await updateFile('css/TestCssModules.vue', (content) =>
          content.replace('color: blue;', 'color: rgb(0, 0, 0);')
        )
        // css module results in component reload so must use fresh selector
        await expectByPolling(
          () => getComputedColor('.css-modules-sfc'),
          'rgb(0, 0, 0)'
        )
      }
    })

    test('CSS @import', async () => {
      const el = await page.$('.script-at-import')
      expect(await getComputedColor(el)).toBe('rgb(0, 128, 0)')
      if (!isBuild) {
        await updateFile('css-@import/imported.css', (content) =>
          content.replace('green', 'rgb(0, 0, 0)')
        )
        await expectByPolling(() => getComputedColor(el), 'rgb(0, 0, 0)')
      }
    })

    test('SFC <style> w/ @import', async () => {
      const el = await page.$('.sfc-style-at-import')
      expect(await getComputedColor(el)).toBe('rgb(255, 0, 0)')
      if (!isBuild) {
        await updateFile(
          'css-@import/testCssAtImportFromStyle.css',
          (content) => content.replace('red', 'rgb(0, 0, 0)')
        )
        await expectByPolling(() => getComputedColor(el), 'rgb(0, 0, 0)')
      }
    })

    test('CSS module @import', async () => {
      const el = await page.$('.sfc-script-css-module-at-import')
      expect(await getComputedColor(el)).toBe('rgb(0, 128, 0)')
      if (!isBuild) {
        await updateFile('css-@import/imported.module.css', (content) =>
          content.replace('green', 'rgb(0, 0, 0)')
        )
        await expectByPolling(
          () => getComputedColor('.sfc-script-css-module-at-import'),
          'rgb(0, 0, 0)'
        )
      }
    })

    test('SFC <style module> w/ @import', async () => {
      const el = await page.$('.sfc-style-css-module-at-import')
      expect(await getComputedColor(el)).toBe('rgb(255, 0, 0)')
      if (!isBuild) {
        await updateFile(
          'css-@import/testCssModuleAtImportFromStyle.module.css',
          (content) => content.replace('red', 'rgb(0, 0, 0)')
        )
        await expectByPolling(() => getComputedColor(el), 'rgb(0, 0, 0)')
      }
    })

    test('CSS preprocessor @import', async () => {
      const el = await page.$('.script-scss-at-import')
      expect(await getComputedColor(el)).toBe('rgb(0, 128, 0)')
      if (!isBuild) {
        await updateFile('css-@import/testScss.imported.scss', (content) =>
          content.replace('green', 'rgb(0, 0, 0)')
        )
        await expectByPolling(() => getComputedColor(el), 'rgb(0, 0, 0)')
      }
    })

    test('SFC <style lang="sass"> w/ @import', async () => {
      const el = await page.$('.sfc-style-scss-at-import')
      expect(await getComputedColor(el)).toBe('rgb(255, 0, 0)')
      if (!isBuild) {
        await updateFile(
          'css-@import/testSCssAtImportFromStyle.scss',
          (content) => content.replace('red', 'rgb(0, 0, 0)')
        )
        await expectByPolling(() => getComputedColor(el), 'rgb(0, 0, 0)')
      }
    })

    test('import *.module.css', async () => {
      const el = await page.$('.css-modules-import')
      expect(await getComputedColor(el)).toBe('rgb(255, 140, 0)')
      if (!isBuild) {
        await updateFile('css/testCssModules.module.css', (content) =>
          content.replace('rgb(255, 140, 0)', 'rgb(0, 0, 1)')
        )
        // css module results in component reload so must use fresh selector
        await expectByPolling(
          () => getComputedColor('.css-modules-import'),
          'rgb(0, 0, 1)'
        )
      }
    })

    test('import *.module.scss', async () => {
      const el = await page.$('.scss-modules-import')
      expect(await getComputedColor(el)).toBe('rgb(255, 0, 255)')
      if (!isBuild) {
        await updateFile('css/testScssModules.module.scss', (content) =>
          content.replace('rgb(255, 0, 255)', 'rgb(0, 0, 2)')
        )
        // css module results in component reload so must use fresh selector
        await expectByPolling(
          () => getComputedColor('.scss-modules-import'),
          'rgb(0, 0, 2)'
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
        await updateFile('json/testJsonImport.json', (c) =>
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
        await updateFile('jsx/testJsx.jsx', (c) => c.replace('1337', '2046'))
        await expectByPolling(() => getText('.jsx-root'), '2046')
      }
    })

    test('alias', async () => {
      expect(await getText('.alias')).toMatch('alias works')
      expect(await getText('.dir-alias')).toMatch('directory alias works')
      expect(await getText('.dir-alias-index')).toMatch(
        'directory alias index works'
      )
      expect(await getText('.dir-alias-import-outside')).toMatch(
        'directory aliased internal import outside works'
      )
      if (!isBuild) {
        await updateFile('alias/aliased/index.js', (c) =>
          c.replace('works', 'hmr works')
        )
        await expectByPolling(() => getText('.alias'), 'alias hmr works')

        await updateFile('alias/aliased-dir/named.js', (c) =>
          c.replace('works', 'hmr works')
        )
        await expectByPolling(
          () => getText('.dir-alias'),
          'directory alias hmr works'
        )

        await updateFile('alias/aliased-dir/index.js', (c) =>
          c.replace('works', 'hmr works')
        )
        await expectByPolling(
          () => getText('.dir-alias-index'),
          'directory alias index hmr works'
        )

        await updateFile('alias/aliased-dir-import.js', (c) =>
          c.replace('works', 'hmr works')
        )
        await expectByPolling(
          () => getText('.dir-alias-import-outside'),
          'directory aliased internal import outside hmr works'
        )
      }
    })

    test('transforms', async () => {
      const el = await getEl('.transform-scss')
      expect(await getComputedColor(el)).toBe('rgb(0, 255, 255)')
      expect(await getText('.transform-js')).toBe('2')
      if (!isBuild) {
        await updateFile('transform/testTransform.scss', (c) =>
          c.replace('cyan', 'rgb(0, 0, 0)')
        )
        await expectByPolling(() => getComputedColor(el), 'rgb(0, 0, 0)')
        await updateFile('transform/testTransform.js', (c) =>
          c.replace('= 1', '= 2')
        )
        await expectByPolling(() => getText('.transform-js'), '3')
      }
    })

    test('async component', async () => {
      await expectByPolling(() => getText('.async'), 'should show up')
      expect(await getComputedColor('.async')).toBe('rgb(139, 69, 19)')
    })

    test('rewrite import in optimized deps', async () => {
      expect(await getText('.test-rewrite-in-optimized')).toMatch(
        moment(1590231082886).format('MMMM Do YYYY, h:mm:ss a')
      )
    })

    test('rewrite import in unoptimized deps', async () => {
      expect(await getText('.test-rewrite-in-unoptimized')).toMatch('123')
    })

    test('monorepo support', async () => {
      // linked dep + optimizing linked dep
      expect(await getText(`.optimize-linked`)).toMatch(`ok`)
      if (!isBuild) {
        // test hmr in linked dep
        await updateFile(`optimize-linked/index.js`, (c) =>
          c.replace(`foo()`, `123`)
        )
        await expectByPolling(() => getText(`.optimize-linked`), 'error')
      }
    })

    test('SFC custom blocks', async () => {
      expect(await getText('.custom-block')).toBe('hello,vite!')
      if (!isBuild) {
        await updateFile('custom-blocks/TestCustomBlocks.vue', (c) =>
          c.replace('hello,vite!', 'hi,vite!')
        )
        await expectByPolling(() => getText('.custom-block'), 'hi,vite!')
        await updateFile('custom-blocks/TestCustomBlocks.vue', (c) =>
          c.replace(`useI18n('en')`, `useI18n('ja')`)
        )
        await expectByPolling(() => getText('.custom-block'), 'こんにちは')
      }
    })

    test('normalize publicPath', async () => {
      expect(await getText('.normalize-public-path')).toMatch(
        JSON.stringify([2, 4])
      )
    })

    test('dynamic imports with variable interpolation', async () => {
      expect(await getText(`.dynamic-import-one`)).toMatch(`One`)
      expect(await getText(`.dynamic-import-two`)).toMatch(`Two`)
    })

    test('importing web worker', async () => {
      await click('.worker-send')
      await expectByPolling(() => getText('.worker-response'), 'pong')
    })

    test('importing wasm', async () => {
      await click('.wasm-send')
      await expectByPolling(() => getText('.wasm-response'), '42')
    })

    test('<script setup> and <style vars>', async () => {
      expect(await getText(`.script-setup-props`)).toMatch(`Test message`)
      expect(await getComputedColor(`.style-vars`)).toBe('rgb(255, 0, 0)')
      await click('.script-setup-change')
      await expectByPolling(
        () => getComputedColor(`.style-vars`),
        'rgb(0, 128, 0)'
      )
      if (!isBuild) {
        // test <script setup HMR>
        await updateFile('script-setup/TestScriptSetupStyleVars.vue', (c) =>
          c.replace(`ref('red')`, `ref('blue')`)
        )
        await expectByPolling(
          () => getComputedColor(`.style-vars`),
          'rgb(0, 0, 255)'
        )
      }
    })
  }

  // test build first since we are going to edit the fixtures when testing dev
  // no need to run build tests when testing service worker mode since it's
  // dev only
  if (!process.env.USE_SW) {
    describe('build', () => {
      let staticServer
      beforeAll(async () => {
        console.log('building...')
        const buildOutput = await execa(binPath, ['build'], {
          cwd: tempDir
        })
        expect(buildOutput.stdout).toMatch('Build completed')
        expect(buildOutput.stderr).toBe('')
        console.log('build complete. running build tests...')
      })

      afterAll(() => {
        console.log('build test done.')
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

      test('css codesplit in async chunks', async () => {
        const colorToMatch = /#8B4513/i // from TestAsync.vue

        const files = await fs.readdir(path.join(tempDir, 'dist/_assets'))
        const cssFile = files.find((f) => f.endsWith('.css'))
        const css = await fs.readFile(
          path.join(tempDir, 'dist/_assets', cssFile),
          'utf-8'
        )
        // should be extracted from the main css file
        expect(css).not.toMatch(colorToMatch)
        // should be inside the split chunk file
        const asyncChunk = files.find(
          (f) => f.startsWith('TestAsync') && f.endsWith('.js')
        )
        const code = await fs.readFile(
          path.join(tempDir, 'dist/_assets', asyncChunk),
          'utf-8'
        )
        // should be inside the async chunk
        expect(code).toMatch(colorToMatch)
      })
    })
  }

  describe('dev', () => {
    beforeAll(async () => {
      browserLogs.length = 0
      console.log('starting dev server...')
      // start dev server
      devServer = execa(binPath, {
        cwd: tempDir
      })
      devServer.stderr.on('data', (data) => {
        serverLogs.push(data.toString())
      })
      await new Promise((resolve) => {
        devServer.stdout.on('data', (data) => {
          serverLogs.push(data.toString())
          if (data.toString().match('running')) {
            console.log('dev server running.')
            resolve()
          }
        })
      })

      console.log('launching browser')
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
      const reload = page.waitForNavigation({
        waitUntil: 'domcontentloaded'
      })
      await updateFile('index.html', (content) =>
        content.replace('Vite App', 'Vite App Test')
      )
      await reload
      await expectByPolling(() => getText('title'), 'Vite App Test')
    })

    test('hmr (html full-reload)', async () => {
      await page.goto('http://localhost:3000/test.html')
      expect(await getText('title')).toMatch('Vite App')
      // hmr
      const reload = page.waitForNavigation({
        waitUntil: 'domcontentloaded'
      })
      await updateFile('test.html', (content) =>
        content.replace('Vite App', 'Vite App Test')
      )
      await reload
      await expectByPolling(() => getText('title'), 'Vite App Test')
    })

    // Assert that all edited files are reflected on page reload
    // i.e. service-worker cache is correctly busted
    if (process.env.USE_SW) {
      test('sw cache busting', async () => {
        await page.reload()

        expect(await getText('.hmr-increment')).toMatch('>>> count is 1337 <<<')
        expect(await getText('.hmr-propagation')).toMatch('666')
        expect(await getComputedColor('.postcss-from-css')).toBe(
          'rgb(0, 128, 0)'
        )
        expect(await getComputedColor('.postcss-from-sfc')).toBe('rgb(0, 0, 0)')
        expect(await getComputedColor('.style-scoped')).toBe('rgb(0, 0, 0)')
        expect(await getComputedColor('.css-modules-sfc')).toBe('rgb(0, 0, 0)')
        expect(await getComputedColor('.css-modules-import')).toBe(
          'rgb(0, 0, 1)'
        )
        expect(await getComputedColor('.pug')).toBe('rgb(0, 0, 0)')
        expect(await getText('.pug')).toMatch('pug with hmr')
        expect(await getComputedColor('.src-imports-style')).toBe(
          'rgb(0, 0, 0)'
        )
        expect(await getText('.src-imports-script')).toMatch('bye from')
        expect(await getText('.src-imports-script')).toMatch('changed')
        expect(await getText('.jsx-root')).toMatch('2046')
        expect(await getText('.alias')).toMatch('alias hmr works')
        expect(await getComputedColor('.transform-scss')).toBe('rgb(0, 0, 0)')
        expect(await getText('.transform-js')).toMatch('3')
        expect(await getText('.json')).toMatch('with hmr')

        // ensure import graph is still working
        await updateFile('json/testJsonImport.json', (c) =>
          c.replace('with hmr', 'with sw reload')
        )
        await expectByPolling(() => getText('.json'), 'with sw reload')
      })
    }
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
