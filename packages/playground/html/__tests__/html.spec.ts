import { getColor, isBuild } from '../../testUtils'

function testPage(isNested: boolean) {
  test('pre transform', async () => {
    expect(await page.$('head meta[name=viewport]')).toBeTruthy()
  })

  test('string transform', async () => {
    expect(await page.textContent('h1')).toBe(
      isNested ? 'Nested' : 'Transformed'
    )
  })

  test('tags transform', async () => {
    const el = await page.$('head meta[name=description]')
    expect(await el.getAttribute('content')).toBe('a vite app')

    const kw = await page.$('head meta[name=keywords]')
    expect(await kw.getAttribute('content')).toBe('es modules')
  })

  test('combined transform', async () => {
    expect(await page.title()).toBe('Test HTML transforms')
    // the p should be injected to body
    expect(await page.textContent('body p.inject')).toBe('This is injected')
  })

  test('server only transform', async () => {
    if (!isBuild) {
      expect(await page.textContent('body p.server')).toMatch(
        'injected only during dev'
      )
    } else {
      expect(await page.innerHTML('body')).not.toMatch('p class="server"')
    }
  })

  test('build only transform', async () => {
    if (isBuild) {
      expect(await page.textContent('body p.build')).toMatch(
        'injected only during build'
      )
    } else {
      expect(await page.innerHTML('body')).not.toMatch('p class="build"')
    }
  })

  test('conditional transform', async () => {
    if (isNested) {
      expect(await page.textContent('body p.conditional')).toMatch(
        'injected only for /nested/'
      )
    } else {
      expect(await page.innerHTML('body')).not.toMatch('p class="conditional"')
    }
  })

  test('css', async () => {
    expect(await getColor('h1')).toBe(isNested ? 'red' : 'blue')
    expect(await getColor('p')).toBe('grey')
  })
}

describe('main', () => {
  testPage(false)
})

describe('nested', () => {
  beforeAll(async () => {
    await page.goto(testURL + '/nested/')
  })

  testPage(true)
})
