import { beforeEach, test } from 'vitest'
import { port } from './serve'
import { page, untilUpdated } from '~utils'

const url = `http://localhost:${port}`

beforeEach(async () => {
  await page.goto(url)
})

test('load json module', async () => {
  await untilUpdated(
    () => page.textContent('.fetch-json-module pre'),
    'export const hello = "hi";\n' +
      'export default {\n' +
      '  hello,\n' +
      '};\n',
  )
})

test('fs json', async () => {
  await untilUpdated(() => page.textContent('.fetch-json-fs pre'), '61')
})
