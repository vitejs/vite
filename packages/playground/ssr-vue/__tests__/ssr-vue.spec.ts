import { editFile, getColor, isBuild, untilUpdated } from '../../testUtils'
import { port } from './serve'
import fetch from 'node-fetch'
import { resolve } from 'path'

const url = `http://localhost:${port}`

test('vuex can be import succeed by named import', async () => {
  await page.goto(url + '/store')
  expect(await page.textContent('h1')).toMatch('bar')

  // raw http request
  const storeHtml = await (await fetch(url + '/store')).text()
  expect(storeHtml).toMatch('bar')
})

test('/about', async () => {
  await page.goto(url + '/about')
  expect(await page.textContent('h1')).toMatch('About')
  // should not have hydration mismatch
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('mismatch')
  })

  // fetch sub route
  const aboutHtml = await (await fetch(url + '/about')).text()
  expect(aboutHtml).toMatch('About')
  if (isBuild) {
    // assert correct preload directive generation for async chunks and CSS
    expect(aboutHtml).not.toMatch(
      /link rel="modulepreload".*?href="\/assets\/Home\.\w{8}\.js"/
    )
    expect(aboutHtml).not.toMatch(
      /link rel="stylesheet".*?href="\/assets\/Home\.\w{8}\.css"/
    )
    expect(aboutHtml).toMatch(
      /link rel="modulepreload".*?href="\/assets\/About\.\w{8}\.js"/
    )
    expect(aboutHtml).toMatch(
      /link rel="stylesheet".*?href="\/assets\/About\.\w{8}\.css"/
    )
  }
})

test('/external', async () => {
  await page.goto(url + '/external')
  expect(await page.textContent('div')).toMatch(
    'Example external component content'
  )
  // should not have hydration mismatch
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('mismatch')
  })

  // fetch sub route
  const externalHtml = await (await fetch(url + '/external')).text()
  expect(externalHtml).toMatch('Example external component content')
  if (isBuild) {
    // assert correct preload directive generation for async chunks and CSS
    expect(externalHtml).not.toMatch(
      /link rel="modulepreload".*?href="\/assets\/Home\.\w{8}\.js"/
    )
    expect(externalHtml).not.toMatch(
      /link rel="stylesheet".*?href="\/assets\/Home\.\w{8}\.css"/
    )
    expect(externalHtml).toMatch(
      /link rel="modulepreload".*?href="\/assets\/External\.\w{8}\.js"/
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
      /link rel="modulepreload".*?href="\/assets\/Home\.\w{8}\.js"/
    )
    expect(html).toMatch(
      /link rel="stylesheet".*?href="\/assets\/Home\.\w{8}\.css"/
    )
    // JSX component preload registration
    expect(html).toMatch(
      /link rel="modulepreload".*?href="\/assets\/Foo\.\w{8}\.js"/
    )
    expect(html).toMatch(
      /link rel="stylesheet".*?href="\/assets\/Foo\.\w{8}\.css"/
    )
    expect(html).not.toMatch(
      /link rel="modulepreload".*?href="\/assets\/About\.\w{8}\.js"/
    )
    expect(html).not.toMatch(
      /link rel="stylesheet".*?href="\/assets\/About\.\w{8}\.css"/
    )
  }
})

test('css', async () => {
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
  // should have no 404s
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
  const img = await page.$('img')
  expect(await img.getAttribute('src')).toMatch(
    isBuild ? /\/assets\/logo\.\w{8}\.png/ : '/src/assets/logo.png'
  )
})

test('jsx', async () => {
  expect(await page.textContent('.jsx')).toMatch('from JSX')
})

test('virtual module', async () => {
  expect(await page.textContent('.virtual')).toMatch('hi')
})

test('nested virtual module', async () => {
  expect(await page.textContent('.nested-virtual')).toMatch('[success]')
})

test('hydration', async () => {
  expect(await page.textContent('button')).toMatch('0')
  await page.click('button')
  expect(await page.textContent('button')).toMatch('1')
})

test('hmr', async () => {
  editFile('src/pages/Home.vue', (code) => code.replace('Home', 'changed'))
  await untilUpdated(() => page.textContent('h1'), 'changed')
})

test('client navigation', async () => {
  await untilUpdated(() => page.textContent('a[href="/about"]'), 'About')
  await page.click('a[href="/about"]')
  await untilUpdated(() => page.textContent('h1'), 'About')
  editFile('src/pages/About.vue', (code) => code.replace('About', 'changed'))
  await untilUpdated(() => page.textContent('h1'), 'changed')
  await page.click('a[href="/"]')
  await untilUpdated(() => page.textContent('a[href="/"]'), 'Home')
})

test('import.meta.url', async () => {
  await page.goto(url)
  expect(await page.textContent('.protocol')).toEqual('file:')
})

test('dynamic css file should be preloaded', async () => {
  if (isBuild) {
    await page.goto(url)
    const homeHtml = await (await fetch(url)).text()
    const re = /link rel="modulepreload".*?href="\/assets\/(Home\.\w{8}\.js)"/
    const filename = re.exec(homeHtml)[1]
    const manifest = require(resolve(
      process.cwd(),
      './packages/temp/ssr-vue/dist/client/ssr-manifest.json'
    ))
    const depFile = manifest[filename]
    for (const file of depFile) {
      expect(homeHtml).toMatch(file)
    }
  }
})
