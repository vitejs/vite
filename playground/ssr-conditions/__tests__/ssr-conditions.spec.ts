import { expect, test } from 'vitest'
import { port } from './serve'
import { page, withRetry } from '~utils'

const url = `http://localhost:${port}`

test('ssr.resolve.conditions affect non-externalized imports during ssr', async () => {
  await page.goto(url)
  expect(await page.textContent('.no-external-react-server')).toMatch(
    'node.unbundled.js',
  )
})

test('ssr.resolve.externalConditions affect externalized imports during ssr', async () => {
  await page.goto(url)
  expect(await page.textContent('.external-react-server')).toMatch('edge.js')
})

test('ssr.resolve settings do not affect non-ssr imports', async () => {
  await page.goto(url)
  await withRetry(async () => {
    expect(await page.textContent('.browser-no-external-react-server')).toMatch(
      'default.js',
    )
  })
  await withRetry(async () => {
    expect(await page.textContent('.browser-external-react-server')).toMatch(
      'default.js',
    )
  })
})
