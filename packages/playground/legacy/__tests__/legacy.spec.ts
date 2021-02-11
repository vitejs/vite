import { isBuild } from '../../testUtils'

test('should work', async () => {
  expect(await page.textContent('#app')).toMatch('Hello')
})

test('import.meta.env.LEGACY', async () => {
  expect(await page.textContent('#env')).toMatch(isBuild ? 'true' : 'false')
})
