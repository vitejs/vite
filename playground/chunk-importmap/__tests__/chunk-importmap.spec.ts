import { expect, test } from 'vitest'
import { browserLogs, expectWithRetry, getColor, page } from '~utils'

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

test('index js', async () => {
  await expectWithRetry(() => page.textContent('.js')).toBe('js: ok')
})

test('importmap', async () => {
  await expectWithRetry(() => page.textContent('.importmap')).toContain(
    '"/foo": "/bar"',
  )
})

test('static js', async () => {
  await expectWithRetry(() => page.textContent('.static-js')).toBe(
    'static-js: ok',
  )
})

test('dynamic js', async () => {
  await expectWithRetry(() => page.textContent('.dynamic-js')).toBe(
    'dynamic-js: ok',
  )
})

test('static css', async () => {
  expect(await getColor('.static')).toBe('red')
})

test('dynamic css', async () => {
  expect(await getColor('.dynamic')).toBe('red')
})

test('worker', async () => {
  await expectWithRetry(() => page.textContent('.worker')).toBe('worker: pong')
})
