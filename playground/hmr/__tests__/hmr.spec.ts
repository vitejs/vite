import {
  browserLogs,
  editFile,
  getBg,
  isBuild,
  page,
  untilUpdated,
  viteTestUrl
} from '~utils'

test('should render', async () => {
  expect(await page.textContent('.app')).toBe('1')
  expect(await page.textContent('.dep')).toBe('1')
  expect(await page.textContent('.nested')).toBe('1')
})

if (!isBuild) {
  test('should connect', async () => {
    expect(browserLogs.length).toBe(2)
    expect(browserLogs.some((msg) => msg.match('connected'))).toBe(true)
    browserLogs.length = 0
  })

  test('self accept', async () => {
    const el = await page.$('.app')

    editFile('hmr.ts', (code) => code.replace('const foo = 1', 'const foo = 2'))
    await untilUpdated(() => el.textContent(), '2')

    expect(browserLogs).toMatchObject([
      '>>> vite:beforeUpdate -- update',
      'foo was: 1',
      '(self-accepting 1) foo is now: 2',
      '(self-accepting 2) foo is now: 2',
      '[vite] hot updated: /hmr.ts'
    ])
    browserLogs.length = 0

    editFile('hmr.ts', (code) => code.replace('const foo = 2', 'const foo = 3'))
    await untilUpdated(() => el.textContent(), '3')

    expect(browserLogs).toMatchObject([
      '>>> vite:beforeUpdate -- update',
      'foo was: 2',
      '(self-accepting 1) foo is now: 3',
      '(self-accepting 2) foo is now: 3',
      '[vite] hot updated: /hmr.ts'
    ])
    browserLogs.length = 0
  })

  test('accept dep', async () => {
    const el = await page.$('.dep')

    editFile('hmrDep.js', (code) =>
      code.replace('const foo = 1', 'const foo = 2')
    )
    await untilUpdated(() => el.textContent(), '2')

    expect(browserLogs).toMatchObject([
      '>>> vite:beforeUpdate -- update',
      '(dep) foo was: 1',
      '(dep) foo from dispose: 1',
      '(single dep) foo is now: 2',
      '(single dep) nested foo is now: 1',
      '(multi deps) foo is now: 2',
      '(multi deps) nested foo is now: 1',
      '[vite] hot updated: /hmrDep.js via /hmr.ts'
    ])
    browserLogs.length = 0

    editFile('hmrDep.js', (code) =>
      code.replace('const foo = 2', 'const foo = 3')
    )
    await untilUpdated(() => el.textContent(), '3')

    expect(browserLogs).toMatchObject([
      '>>> vite:beforeUpdate -- update',
      '(dep) foo was: 2',
      '(dep) foo from dispose: 2',
      '(single dep) foo is now: 3',
      '(single dep) nested foo is now: 1',
      '(multi deps) foo is now: 3',
      '(multi deps) nested foo is now: 1',
      '[vite] hot updated: /hmrDep.js via /hmr.ts'
    ])
    browserLogs.length = 0
  })

  test('nested dep propagation', async () => {
    const el = await page.$('.nested')

    editFile('hmrNestedDep.js', (code) =>
      code.replace('const foo = 1', 'const foo = 2')
    )
    await untilUpdated(() => el.textContent(), '2')

    expect(browserLogs).toMatchObject([
      '>>> vite:beforeUpdate -- update',
      '(dep) foo was: 3',
      '(dep) foo from dispose: 3',
      '(single dep) foo is now: 3',
      '(single dep) nested foo is now: 2',
      '(multi deps) foo is now: 3',
      '(multi deps) nested foo is now: 2',
      '[vite] hot updated: /hmrDep.js via /hmr.ts'
    ])
    browserLogs.length = 0

    editFile('hmrNestedDep.js', (code) =>
      code.replace('const foo = 2', 'const foo = 3')
    )
    await untilUpdated(() => el.textContent(), '3')

    expect(browserLogs).toMatchObject([
      '>>> vite:beforeUpdate -- update',
      '(dep) foo was: 3',
      '(dep) foo from dispose: 3',
      '(single dep) foo is now: 3',
      '(single dep) nested foo is now: 3',
      '(multi deps) foo is now: 3',
      '(multi deps) nested foo is now: 3',
      '[vite] hot updated: /hmrDep.js via /hmr.ts'
    ])
    browserLogs.length = 0
  })

  test('plugin hmr handler + custom event', async () => {
    const el = await page.$('.custom')
    editFile('customFile.js', (code) => code.replace('custom', 'edited'))
    await untilUpdated(() => el.textContent(), 'edited')
  })

  test('plugin client-server communication', async () => {
    const el = await page.$('.custom-communication')
    await untilUpdated(() => el.textContent(), '3')
  })

  test('full-reload encodeURI path', async () => {
    await page.goto(
      viteTestUrl + '/unicode-path/中文-にほんご-한글-🌕🌖🌗/index.html'
    )
    const el = await page.$('#app')
    expect(await el.textContent()).toBe('title')
    await editFile(
      'unicode-path/中文-にほんご-한글-🌕🌖🌗/index.html',
      (code) => code.replace('title', 'title2')
    )
    await page.waitForEvent('load')
    await untilUpdated(
      async () => (await page.$('#app')).textContent(),
      'title2'
    )
  })

  test('CSS update preserves query params', async () => {
    await page.goto(viteTestUrl)

    editFile('global.css', (code) => code.replace('white', 'tomato'))

    const elprev = await page.$('.css-prev')
    const elpost = await page.$('.css-post')
    await untilUpdated(() => elprev.textContent(), 'param=required')
    await untilUpdated(() => elpost.textContent(), 'param=required')
    const textprev = await elprev.textContent()
    const textpost = await elpost.textContent()
    expect(textprev).not.toBe(textpost)
    expect(textprev).not.toMatch('direct')
    expect(textpost).not.toMatch('direct')
  })

  test('not loaded dynamic import', async () => {
    await page.goto(viteTestUrl + '/counter/index.html')

    let btn = await page.$('button')
    expect(await btn.textContent()).toBe('Counter 0')
    await btn.click()
    expect(await btn.textContent()).toBe('Counter 1')

    // Modifying `index.ts` triggers a page reload, as expected
    editFile('counter/index.ts', (code) => code)
    await page.waitForNavigation()
    btn = await page.$('button')
    expect(await btn.textContent()).toBe('Counter 0')

    await btn.click()
    expect(await btn.textContent()).toBe('Counter 1')

    // #7561
    // `dep.ts` defines `import.module.hot.accept` and has not been loaded.
    // Therefore, modifying it has no effect (doesn't trigger a page reload).
    // (Note that, a dynamic import that is never loaded and that does not
    // define `accept.module.hot.accept` may wrongfully trigger a full page
    // reload, see discussion at #7561.)
    editFile('counter/dep.ts', (code) => code)
    try {
      await page.waitForNavigation({ timeout: 1000 })
    } catch (err) {
      const errMsg = 'page.waitForNavigation: Timeout 1000ms exceeded.'
      expect(err.message.slice(0, errMsg.length)).toBe(errMsg)
    }
    btn = await page.$('button')
    expect(await btn.textContent()).toBe('Counter 1')
  })

  test('css in html hmr', async () => {
    await page.goto(viteTestUrl)
    expect(await getBg('.import-image')).toMatch('icon')
    await page.goto(viteTestUrl + '/foo/')
    expect(await getBg('.import-image')).toMatch('icon')
    editFile('index.html', (code) => code.replace('url("./icon.png")', ''))
    await page.waitForNavigation()
    expect(await getBg('.import-image')).toMatch('')
  })

  test('HTML', async () => {
    await page.goto(viteTestUrl + '/counter/index.html')
    let btn = await page.$('button')
    expect(await btn.textContent()).toBe('Counter 0')
    editFile('counter/index.html', (code) =>
      code.replace('Counter', 'Compteur')
    )
    await page.waitForNavigation()
    btn = await page.$('button')
    expect(await btn.textContent()).toBe('Compteur 0')
  })
}
