import { isBuild, editFile, untilUpdated } from '../../testUtils'

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

    editFile('hmr.js', (code) => code.replace('const foo = 1', 'const foo = 2'))
    await untilUpdated(() => el.textContent(), '2')

    expect(browserLogs).toMatchObject([
      '>>> vite:beforeUpdate -- update',
      'foo was: 1',
      '(self-accepting 1) foo is now: 2',
      '(self-accepting 2) foo is now: 2',
      '[vite] hot updated: /hmr.js'
    ])
    browserLogs.length = 0

    editFile('hmr.js', (code) => code.replace('const foo = 2', 'const foo = 3'))
    await untilUpdated(() => el.textContent(), '3')

    expect(browserLogs).toMatchObject([
      '>>> vite:beforeUpdate -- update',
      'foo was: 2',
      '(self-accepting 1) foo is now: 3',
      '(self-accepting 2) foo is now: 3',
      '[vite] hot updated: /hmr.js'
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
      '[vite] hot updated: /hmrDep.js via /hmr.js'
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
      '[vite] hot updated: /hmrDep.js via /hmr.js'
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
      '[vite] hot updated: /hmrDep.js via /hmr.js'
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
      '[vite] hot updated: /hmrDep.js via /hmr.js'
    ])
    browserLogs.length = 0
  })

  test('plugin hmr handler + custom event', async () => {
    const el = await page.$('.custom')
    editFile('customFile.js', (code) => code.replace('custom', 'edited'))
    await untilUpdated(() => el.textContent(), 'edited')
  })

  test('full-reload encodeURI path', async () => {
    await page.goto(
      viteTestUrl + '/unicode-path/中文-にほんご-한글-🌕🌖🌗/index.html'
    )
    let el = await page.$('#app')
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
}
