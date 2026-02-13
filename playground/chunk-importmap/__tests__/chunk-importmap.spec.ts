import { expect, test } from 'vitest'
import { browserLogs, getColor, page } from '~utils'

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

test('index js', async () => {
  await expect.poll(() => page.textContent('.js')).toBe('js: ok')
})

test('importmap', async () => {
  await expect
    .poll(() => page.textContent('.importmap'))
    .toContain('"/foo": "/bar"')
})

test('static js', async () => {
  await expect.poll(() => page.textContent('.static-js')).toBe('static-js: ok')
})

test('dynamic js', async () => {
  await expect
    .poll(() => page.textContent('.dynamic-js'))
    .toBe('dynamic-js: ok')
})

test('static css', async () => {
  await expect.poll(() => getColor('.static')).toBe('red')
})

test('dynamic css', async () => {
  await expect.poll(() => getColor('.dynamic')).toBe('red')
})

test('worker', async () => {
  await expect.poll(() => page.textContent('.worker')).toBe('worker: pong')
})
