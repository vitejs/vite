import fetch from 'node-fetch'
import { expect, test } from 'vitest'
import { port } from './serve'
import { browserLogs, editFile, page, untilUpdated } from '~utils'

const url = `http://localhost:${port}`

test('/env', async () => {
  await page.goto(url + '/env')
  expect(await page.textContent('h1')).toMatch('default message here')

  // raw http request
  const envHtml = await (await fetch(url + '/env')).text()
  expect(envHtml).toMatch('API_KEY_qwertyuiop')
})

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
  await page.goto(url)
  editFile('src/pages/Home.jsx', (code) =>
    code.replace('<h1>Home', '<h1>changed')
  )
  await untilUpdated(() => page.textContent('h1'), 'changed')
})

test('client navigation', async () => {
  await page.goto(url)
  await untilUpdated(() => page.textContent('a[href="/about"]'), 'About')
  await page.click('a[href="/about"]')
  await untilUpdated(() => page.textContent('h1'), 'About')
  editFile('src/pages/About.jsx', (code) =>
    code.replace('<h1>About', '<h1>changed')
  )
  await untilUpdated(() => page.textContent('h1'), 'changed')
})

test(`circular dependencies modules doesn't throw`, async () => {
  await page.goto(url)
  expect(await page.textContent('.circ-dep-init')).toMatch(
    'circ-dep-init-a circ-dep-init-b'
  )
})
