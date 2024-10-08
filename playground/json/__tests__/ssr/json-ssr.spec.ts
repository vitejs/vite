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
    'const default_ = JSON.parse("{\\n  \\"hello\\": \\"hi\\"\\n}\\n");\n' +
      'export default default_;\n' +
      'export const hello = default_.hello;',
  )
})

test('fs json', async () => {
  await untilUpdated(() => page.textContent('.fetch-json-fs pre'), '61')
})
