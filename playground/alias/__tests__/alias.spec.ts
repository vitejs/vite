import { editFile, getColor, untilUpdated } from '../../testUtils'

test('fs', async () => {
  expect(await page.textContent('.fs')).toMatch('[success] alias to fs path')
})

test('fs directory', async () => {
  expect(await page.textContent('.fs-dir')).toMatch(
    '[success] alias to directory'
  )
})

test('regex', async () => {
  expect(await page.textContent('.regex')).toMatch(
    '[success] alias to directory via regex'
  )
})

test('dependency', async () => {
  expect(await page.textContent('.dep')).toMatch('[success] out of root')
})

test('js via script src', async () => {
  expect(await page.textContent('.from-script-src')).toMatch(
    '[success] from script src'
  )
})

test('css via link', async () => {
  expect(await getColor('body')).toBe('grey')
  editFile('dir/test.css', (code) => code.replace('grey', 'red'))
  await untilUpdated(() => getColor('body'), 'red')
})

test('optimized dep', async () => {
  expect(await page.textContent('.optimized')).toMatch(
    '[success] alias optimized'
  )
})

test('aliased module', async () => {
  expect(await page.textContent('.aliased-module')).toMatch(
    '[success] aliased module'
  )
})
