import { port } from './serve'
import { isBuild, page } from '~utils'

const url = `http://localhost:${port}`

describe.runIf(isBuild)('legacy-ssr', () => {
  test('should work', async () => {
    await page.goto(url)
    expect(await page.textContent('#app')).toMatch('Hello')
  })

  test('import.meta.env.LEGACY', async () => {
    // SSR build is always modern
    expect(await page.textContent('#env')).toMatch('false')
  })
})
