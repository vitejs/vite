import { isBuild, untilUpdated, mochaSetup, mochaReset } from '../../testUtils'

describe('legacy.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('should work', async () => {
    expect(await page.textContent('#app')).toMatch('Hello')
  })

  it('import.meta.env.LEGACY', async () => {
    expect(await page.textContent('#env')).toMatch(isBuild ? 'true' : 'false')
  })

  // https://github.com/vitejs/vite/issues/3400
  it('transpiles down iterators correctly', async () => {
    expect(await page.textContent('#iterators')).toMatch('hello')
  })

  it('wraps with iife', async () => {
    expect(await page.textContent('#babel-helpers')).toMatch(
      'exposed babel helpers: false'
    )
  })

  it('generates assets', async () => {
    await untilUpdated(
      () => page.textContent('#assets'),
      isBuild
        ? [
            'index: 404',
            'index-legacy: 404',
            'chunk-async: 404',
            'chunk-async-legacy: 404',
            'immutable-chunk: 200',
            'immutable-chunk-legacy: 200',
            'polyfills-legacy: 404'
          ].join('\n')
        : [
            'index: 404',
            'index-legacy: 404',
            'chunk-async: 404',
            'chunk-async-legacy: 404',
            'immutable-chunk: 404',
            'immutable-chunk-legacy: 404',
            'polyfills-legacy: 404'
          ].join('\n'),
      true
    )
  })
})
