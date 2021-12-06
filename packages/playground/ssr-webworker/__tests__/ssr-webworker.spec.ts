import { port } from './serve'
import { mochaSetup, mochaReset } from '../../testUtils'

const url = `http://localhost:${port}`

describe('ssr-webworker.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('/', async () => {
    await page.goto(url + '/')
    expect(await page.textContent('h1')).toMatch('hello from webworker')
    expect(await page.textContent('.linked')).toMatch(
      'dep from upper directory'
    )
    expect(await page.textContent('.external')).toMatch('object')
  })
})
