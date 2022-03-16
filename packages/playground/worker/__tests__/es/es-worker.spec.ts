// run iife worker
import '../worker.spec'

test('emit chunk', async () => {
  expect(await page.textContent('.emti-chunk-worker')).toMatch(
    '{"msg1":"module1","msg2":"module2","msg3":"module3"}'
  )
  expect(await page.textContent('.emti-chunk-dynamic-import-worker')).toMatch(
    '"A string/es/"'
  )
})
