import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import fetch from 'node-fetch'
import { port } from './serve'
import {
  browserLogs,
  editFile,
  getColor,
  isBuild,
  page,
  untilUpdated,
  viteServer
} from '~utils'

const url = `http://localhost:${port}/test/`

test('vuex can be import succeed by named import', async () => {
  // wait networkidle for dynamic optimize vuex
  await page.goto(url + 'store', { waitUntil: 'networkidle' })
  expect(await page.textContent('h1')).toMatch('bar')

  // raw http request
  const storeHtml = await (await fetch(url + 'store')).text()
  expect(storeHtml).toMatch('bar')
})

test('/about', async () => {
  await page.goto(url + 'about')
  expect(await page.textContent('h1')).toMatch('About')
  // should not have hydration mismatch
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('mismatch')
  })

  // fetch sub route
  const aboutHtml = await (await fetch(url + 'about')).text()
  expect(aboutHtml).toMatch('About')
  if (isBuild) {
    // assert correct preload directive generation for async chunks and CSS
    expect(aboutHtml).not.toMatch(
      /link rel="modulepreload".*?href="\/test\/assets\/Home\.\w{8}\.js"/
    )
    expect(aboutHtml).not.toMatch(
      /link rel="stylesheet".*?href="\/test\/assets\/Home\.\w{8}\.css"/
    )
    expect(aboutHtml).toMatch(
      /link rel="modulepreload".*?href="\/test\/assets\/About\.\w{8}\.js"/
    )
    expect(aboutHtml).toMatch(
      /link rel="stylesheet".*?href="\/test\/assets\/About\.\w{8}\.css"/
    )
  }
})

test('/external', async () => {
  await page.goto(url + 'external')
  expect(await page.textContent('div')).toMatch(
    'Example external component content'
  )
  // should not have hydration mismatch
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('mismatch')
  })

  // fetch sub route
  const externalHtml = await (await fetch(url + 'external')).text()
  expect(externalHtml).toMatch('Example external component content')
  if (isBuild) {
    // assert correct preload directive generation for async chunks and CSS
    expect(externalHtml).not.toMatch(
      /link rel="modulepreload".*?href="\/test\/assets\/Home\.\w{8}\.js"/
    )
    expect(externalHtml).not.toMatch(
      /link rel="stylesheet".*?href="\/test\/assets\/Home\.\w{8}\.css"/
    )
    expect(externalHtml).toMatch(
      /link rel="modulepreload".*?href="\/test\/assets\/External\.\w{8}\.js"/
    )
  }
})

test('/', async () => {
  await page.goto(url)
  expect(await page.textContent('h1')).toMatch('Home')
  // should not have hydration mismatch
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('mismatch')
  })

  const html = await (await fetch(url)).text()
  expect(html).toMatch('Home')
  if (isBuild) {
    // assert correct preload directive generation for async chunks and CSS
    expect(html).toMatch(
      /link rel="modulepreload".*?href="\/test\/assets\/Home\.\w{8}\.js"/
    )
    expect(html).toMatch(
      /link rel="stylesheet".*?href="\/test\/assets\/Home\.\w{8}\.css"/
    )
    // JSX component preload registration
    expect(html).toMatch(
      /link rel="modulepreload".*?href="\/test\/assets\/Foo\.\w{8}\.js"/
    )
    expect(html).toMatch(
      /link rel="stylesheet".*?href="\/test\/assets\/Foo\.\w{8}\.css"/
    )
    expect(html).not.toMatch(
      /link rel="modulepreload".*?href="\/test\/assets\/About\.\w{8}\.js"/
    )
    expect(html).not.toMatch(
      /link rel="stylesheet".*?href="\/test\/assets\/About\.\w{8}\.css"/
    )
  }
})

test('css', async () => {
  await page.goto(url)
  if (isBuild) {
    expect(await getColor('h1')).toBe('green')
    expect(await getColor('.jsx')).toBe('blue')
  } else {
    // During dev, the CSS is loaded from async chunk and we may have to wait
    // when the test runs concurrently.
    await untilUpdated(() => getColor('h1'), 'green')
    await untilUpdated(() => getColor('.jsx'), 'blue')
  }
})

test('asset', async () => {
  await page.goto(url)
  // should have no 404s
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
  const img = await page.$('img')
  expect(await img.getAttribute('src')).toMatch(
    isBuild ? /\/test\/assets\/logo\.\w{8}\.png/ : '/src/assets/logo.png'
  )
})

test('jsx', async () => {
  await page.goto(url)
  expect(await page.textContent('.jsx')).toMatch('from JSX')
})

test('virtual module', async () => {
  await page.goto(url)
  expect(await page.textContent('.virtual')).toMatch('hi')
})

test('nested virtual module', async () => {
  await page.goto(url)
  expect(await page.textContent('.nested-virtual')).toMatch('[success]')
})

test('hydration', async () => {
  await page.goto(url)
  expect(await page.textContent('button')).toMatch('0')
  await page.click('button')
  expect(await page.textContent('button')).toMatch('1')
})

test('hmr', async () => {
  // This is test is flaky in Mac CI, but can't be reproduced locally. Wait until
  // network idle to avoid the issue. TODO: This may be caused by a bug when
  // modifying a file while loading, we should remove this guard
  await page.goto(url, { waitUntil: 'networkidle' })
  editFile('src/pages/Home.vue', (code) => code.replace('Home', 'changed'))
  await untilUpdated(() => page.textContent('h1'), 'changed')
})

test('client navigation', async () => {
  await page.goto(url)
  await untilUpdated(() => page.textContent('a[href="/test/about"]'), 'About')
  await page.click('a[href="/test/about"]')
  await untilUpdated(() => page.textContent('h1'), 'About')
  editFile('src/pages/About.vue', (code) => code.replace('About', 'changed'))
  await untilUpdated(() => page.textContent('h1'), 'changed')
  await page.click('a[href="/test/"]')
  await untilUpdated(() => page.textContent('a[href="/test/"]'), 'Home')
})

test('import.meta.url', async () => {
  await page.goto(url)
  expect(await page.textContent('.protocol')).toEqual('file:')
})

test.runIf(isBuild)('dynamic css file should be preloaded', async () => {
  await page.goto(url)
  const homeHtml = await (await fetch(url)).text()
  const re =
    /link rel="modulepreload".*?href="\/test\/assets\/(Home\.\w{8}\.js)"/
  const filename = re.exec(homeHtml)[1]
  const manifest = (
    await import(
      resolve(
        process.cwd(),
        './playground-temp/ssr-vue/dist/client/ssr-manifest.json'
      )
    )
  ).default
  const depFile = manifest[filename]
  for (const file of depFile) {
    expect(homeHtml).toMatch(file)
  }
})

test.runIf(!isBuild)(
  'always throw error when evaluating an wrong SSR module',
  async () => {
    const __filename = fileURLToPath(import.meta.url)
    const badjs = resolve(__filename, '../fixtures/ssrModuleLoader-bad.js')
    const THROW_MESSAGE = 'it is an expected error'

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const expectedErrors = []
    for (const _ of [0, 1]) {
      try {
        console.log(viteServer)
        await viteServer.ssrLoadModule(badjs, { fixStacktrace: true })
      } catch (e) {
        expectedErrors.push(e)
      }
    }
    expect(expectedErrors).toHaveLength(2)
    expect(expectedErrors[0]).toBe(expectedErrors[1])
    expectedErrors.forEach((error) => {
      expect(error?.message).toContain(THROW_MESSAGE)
    })
    expect(spy).toBeCalledTimes(1)
    const [firstParameter] = spy.mock.calls[0]
    expect(firstParameter).toContain('Error when evaluating SSR module')
    expect(firstParameter).toContain(THROW_MESSAGE)
    spy.mockClear()
  }
)
