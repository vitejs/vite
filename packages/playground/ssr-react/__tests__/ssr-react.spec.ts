import { editFile, getColor, isBuild, untilUpdated } from '../../testUtils'
import { port } from './serve'
import fetch from 'node-fetch'

const url = `http://localhost:${port}`

test('/about', async () => {
  await page.goto(url + '/about')
  expect(await page.textContent('h1')).toMatch('About')
  // should not have hydration mismatch
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('Expected server HTML')
  })

  // raw http request
  const aboutHtml = await (await fetch(url + '/about')).text()
  expect(aboutHtml).toMatch('About')
})

test('/', async () => {
  await page.goto(url)
  expect(await page.textContent('h1')).toMatch('Home')
  // should not have hydration mismatch
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('Expected server HTML')
  })

  // raw http request
  const html = await (await fetch(url)).text()
  expect(html).toMatch('Home')
})

test('hmr', async () => {
  editFile('src/pages/Home.jsx', (code) =>
    code.replace('<h1>Home', '<h1>changed')
  )
  await untilUpdated(() => page.textContent('h1'), 'changed')
})

test('client navigation', async () => {
  await page.click('a[href="/about"]')
  await page.waitForTimeout(10)
  expect(await page.textContent('h1')).toMatch('About')
  editFile('src/pages/About.jsx', (code) =>
    code.replace('<h1>About', '<h1>changed')
  )
  await untilUpdated(() => page.textContent('h1'), 'changed')
})
