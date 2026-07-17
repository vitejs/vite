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

// a CSS-only module shared by multiple chunks becomes a pure CSS chunk that is
// removed from the output. The import map must not keep referencing its removed
// JS file, otherwise chunks importing it 404 and fail to execute
// (https://github.com/vitejs/vite/issues/22740)
test('shared pure css chunk', async () => {
  await expect.poll(() => page.textContent('.shared-js')).toBe('shared-js: ok')
  await expect.poll(() => getColor('.shared')).toBe('green')
})

test('worker', async () => {
  await expect.poll(() => page.textContent('.worker')).toBe('worker: pong')
})
