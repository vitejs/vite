import { editFile, getColor, isBuild, untilUpdated } from '../../testUtils'
import { port } from './serve'
import fetch from 'node-fetch'

const url = `http://localhost:${port}`
const vueUrl = `${url}/vue`
const reactUrl = `${url}/react`

test('should work', async () => {
  await page.goto(url)
  const html = await page.innerHTML('#app')
  expect(html).toMatch(`<a href="/vue">`)
  expect(html).toMatch(`<a href="/react">`)
})

describe('Vue', () => {
  beforeAll(async () => {
    await page.goto(vueUrl)
  })

  test('should render correctly on server', async () => {
    const html = await (await fetch(vueUrl)).text()
    expect(html).toMatch('Hello from Vue')
    if (isBuild) {
      // assert correct preload directive generation for async chunks and CSS
      expect(html).toMatch(
        /link rel="modulepreload".*?href="\/assets\/Async\.\w{8}\.js"/
      )
      expect(html).toMatch(
        /link rel="stylesheet".*?href="\/assets\/Async\.\w{8}\.css"/
      )
    }
  })

  test('should render correctly on client', async () => {
    expect(await page.textContent('h1')).toMatch('Hello from Vue')
  })

  test('css', async () => {
    // the CSS is loaded from async chunk and we may have to wait when the test
    // runs concurrently.
    await untilUpdated(() => getColor('h1'), 'green')
  })

  test('asset', async () => {
    // should have no 404s
    browserLogs.forEach((msg) => {
      expect(msg).not.toMatch('404')
    })
    const img = await page.$('img')
    expect(await img.getAttribute('src')).toMatch(
      isBuild ? /\/assets\/asset\.\w{8}\.png/ : '/src/assets/asset.png'
    )
  })

  test('hydration', async () => {
    // should not have hydration mismatch!
    browserLogs.forEach((msg) => {
      expect(msg).not.toMatch('mismatch')
    })
    expect(await page.textContent('button')).toBe('0')
    await page.click('button')
    expect(await page.textContent('button')).toBe('1')
  })

  test('hmr', async () => {
    editFile('src/vue/Async.vue', (code) =>
      code.replace('Hello from Vue', 'changed')
    )
    await untilUpdated(() => page.textContent('h1'), 'changed')
  })
})

describe('React', () => {
  beforeAll(async () => {
    await page.goto(reactUrl)
  })

  test('should render correctly on server', async () => {
    const html = await (await fetch(reactUrl)).text()
    expect(html).toMatch('Hello from React')
  })

  test('should render correctly on client', async () => {
    expect(await page.textContent('h1')).toMatch('Hello from React')
    expect(
      await page.evaluate(() =>
        document.querySelector('h1')!.hasAttribute('data-reactroot')
      )
    ).toBe(true)
  })

  test('hmr', async () => {
    editFile('src/react/Child.jsx', (code) =>
      code.replace('Hello from React', 'changed')
    )
    await untilUpdated(() => page.textContent('h1'), 'changed')
  })
})
