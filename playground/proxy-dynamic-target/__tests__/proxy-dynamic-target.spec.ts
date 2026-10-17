import { expect, test } from 'vitest'
import { viteTestUrl } from '~utils'

test('selects the proxy target for each request', async () => {
  const paths = [
    '/dynamic/first/one',
    '/dynamic/second/two',
    '/dynamic/first/three',
    '/dynamic/second/four',
  ]
  const responses = await Promise.all(
    paths.map(async (path) => {
      const response = await fetch(new URL(path, viteTestUrl))
      expect(response.status).toBe(200)
      return response.text()
    }),
  )

  expect(responses).toEqual([
    'first:/one',
    'second:/two',
    'first:/three',
    'second:/four',
  ])
})
