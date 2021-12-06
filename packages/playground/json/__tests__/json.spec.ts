import { isBuild, mochaReset, mochaSetup } from '../../testUtils'

const json = require('../test.json')
const deepJson = require('vue/package.json')
const stringified = JSON.stringify(json)
const deepStringified = JSON.stringify(deepJson)

describe('json.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('default import', async () => {
    expect(await page.textContent('.full')).toBe(stringified)
  })

  it('named import', async () => {
    expect(await page.textContent('.named')).toBe(json.hello)
  })

  it('deep import', async () => {
    expect(await page.textContent('.deep-full')).toBe(deepStringified)
  })

  it('named deep import', async () => {
    expect(await page.textContent('.deep-named')).toBe(deepJson.name)
  })

  it('dynamic import', async () => {
    expect(await page.textContent('.dynamic')).toBe(stringified)
  })

  it('dynamic import, named', async () => {
    expect(await page.textContent('.dynamic-named')).toBe(json.hello)
  })

  it('fetch', async () => {
    expect(await page.textContent('.fetch')).toBe(stringified)
  })

  it('?url', async () => {
    expect(await page.textContent('.url')).toMatch(
      isBuild ? 'data:application/json' : '/test.json'
    )
  })

  it('?raw', async () => {
    expect(await page.textContent('.raw')).toBe(
      require('fs').readFileSync(require.resolve('../test.json'), 'utf-8')
    )
  })
})
