import { isBuild } from '../../../testUtils'
import { port } from './serve'

const url = `http://localhost:${port}`

test('worker legacy', async () => {
  await page.goto(url)
  expect(await page.textContent('.log-worker')).toMatch('pong')
})
