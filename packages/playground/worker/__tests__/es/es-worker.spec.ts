import { untilUpdated, isBuild } from '../../../testUtils'

const timeout = (n: number) => new Promise((r) => setTimeout(r, n))

test('emit chunk', async () => {
  await timeout(100)
  expect(await page.textContent('.emti-chunk-worker')).toMatch(
    '{"msg1":"module1","msg2":"module2","msg3":"module3"}'
  )
  expect(await page.textContent('.emti-chunk-dynamic-import-worker')).toMatch(
    '"A string/es/"'
  )
})
