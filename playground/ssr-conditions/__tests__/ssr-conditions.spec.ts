import { expect, test } from 'vitest'
import { port } from './serve'
import { isServe, page } from '~utils'

const url = `http://localhost:${port}`

test('ssr.resolve.conditions affect non-externalized imports during ssr', async () => {
  await page.goto(url)
  expect(await page.textContent('.no-external-react-server')).toMatch(
    'node.unbundled.js',
  )
})

// externalConditions is only used for dev
test.runIf(isServe)(
  'ssr.resolve.externalConditions affect externalized imports during ssr',
  async () => {
    await page.goto(url)
    expect(await page.textContent('.external-react-server')).toMatch('edge.js')
  },
)

test('ssr.resolve settings do not affect non-ssr imports', async () => {
  await page.goto(url)
  await expect
    .poll(() => page.textContent('.browser-no-external-react-server'))
    .toMatch('default.js')
  await expect
    .poll(() => page.textContent('.browser-external-react-server'))
    .toMatch('default.js')
})
