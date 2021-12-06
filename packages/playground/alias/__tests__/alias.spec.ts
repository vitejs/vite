import {
  editFile,
  getColor,
  untilUpdated,
  mochaSetup,
  mochaReset
} from '../../testUtils'

describe('alias.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('fs', async () => {
    expect(await page.textContent('.fs')).toMatch('[success] alias to fs path')
  })

  it('fs directory', async () => {
    expect(await page.textContent('.fs-dir')).toMatch(
      '[success] alias to directory'
    )
  })

  it('regex', async () => {
    expect(await page.textContent('.regex')).toMatch(
      '[success] alias to directory via regex'
    )
  })

  it('dependency', async () => {
    expect(await page.textContent('.dep')).toMatch('[success] out of root')
  })

  it('js via script src', async () => {
    expect(await page.textContent('.from-script-src')).toMatch(
      '[success] from script src'
    )
  })

  it('css via link', async () => {
    expect(await getColor('body')).toBe('grey')
    editFile('dir/test.css', (code) => code.replace('grey', 'red'))
    await untilUpdated(() => getColor('body'), 'red')
  })

  it('optimized dep', async () => {
    expect(await page.textContent('.optimized')).toMatch(
      '[success] alias optimized'
    )
  })

  it('aliased module', async () => {
    expect(await page.textContent('.aliased-module')).toMatch(
      '[success] aliased module'
    )
  })
})
