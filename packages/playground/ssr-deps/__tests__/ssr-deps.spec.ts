import { port } from './serve'
import { mochaSetup, mochaReset } from '../../testUtils'

const url = `http://localhost:${port}`

/**
 * test for #5809
 *
 * NOTE: This test will always succeed now, unless the temporary workaround for Jest can be removed
 * See https://github.com/vitejs/vite/pull/5197#issuecomment-938054077
 */
describe('ssr-deps.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('msg from node addon', async () => {
    await page.goto(url)
    expect(await page.textContent('.node-addon-msg')).toMatch('Hello World!')
  })

  it('msg read by fs/promises', async () => {
    await page.goto(url)
    expect(await page.textContent('.file-message')).toMatch('File Content!')
  })

  it('msg from primitive export', async () => {
    await page.goto(url)
    expect(await page.textContent('.primitive-export-message')).toMatch(
      'Hello World!'
    )
  })

  it('msg from TS transpiled exports', async () => {
    await page.goto(url)
    expect(await page.textContent('.ts-default-export-message')).toMatch(
      'Hello World!'
    )
    expect(await page.textContent('.ts-named-export-message')).toMatch(
      'Hello World!'
    )
  })

  it('msg from Object.assign exports', async () => {
    await page.goto(url)
    expect(await page.textContent('.object-assigned-exports-message')).toMatch(
      'Hello World!'
    )
  })

  it('msg from forwarded exports', async () => {
    await page.goto(url)
    expect(await page.textContent('.forwarded-export-message')).toMatch(
      'Hello World!'
    )
  })
})
