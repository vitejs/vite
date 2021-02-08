import { editFile, getColor, isBuild, untilUpdated } from '../../testUtils'
import { port } from './serve'
import fetch from 'node-fetch'

const url = `http://localhost:${port}`

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
  } else {
    // During dev, the CSS is loaded from async chunk and we may have to wait
    // when the test runs concurrently.
    await untilUpdated(() => getColor('h1'), 'green')
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
  await page.click('a[href="/about"]')
  await page.waitForTimeout(10)
  expect(await page.textContent('h1')).toMatch('About')
  editFile('src/pages/About.vue', (code) => code.replace('About', 'changed'))
  await untilUpdated(() => page.textContent('h1'), 'changed')
})
