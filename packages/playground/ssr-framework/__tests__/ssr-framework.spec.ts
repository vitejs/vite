import { getColor, isBuild, untilUpdated } from '../../testUtils'
import { port } from './serve'
import fetch from 'node-fetch'

const url = `http://localhost:${port}`

test('/', async () => {
  await page.goto(url)
  expect(await page.textContent('h1')).toBe('Home')
  if (isBuild) {
    expect(await getColor('h1')).toBe('black')
  } else {
    // During dev, the CSS is loaded from async chunk and we may have to wait
    // when the test runs concurrently.
    await untilUpdated(() => getColor('h1'), 'black')
  }

  // is rendered to HTML
  const homeHtml = await (await fetch(url + '/')).text()
  expect(homeHtml).toContain('count is: 0')
})

test('hydration', async () => {
  expect(await page.textContent('button')).toContain('0')
  await page.click('button')
  expect(await page.textContent('button')).toContain('1')

  // should not have hydration mismatch
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('mismatch')
  })
})

test('/about', async () => {
  await page.goto(url + '/about')
  expect(await page.textContent('h1')).toBe('About')
  if (isBuild) {
    expect(await getColor('h1')).toBe('red')
  } else {
    // During dev, the CSS is loaded from async chunk and we may have to wait
    // when the test runs concurrently.
    await untilUpdated(() => getColor('h1'), 'red')
  }

  // is rendered to HTML
  const aboutHtml = await (await fetch(url + '/about')).text()
  expect(aboutHtml).toContain('A colored page.')

  // should not have hydration mismatch
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('mismatch')
  })
})
