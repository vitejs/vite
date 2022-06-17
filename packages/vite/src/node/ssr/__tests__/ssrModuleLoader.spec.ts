import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { expect, test, vi } from 'vitest'
import { createServer } from '../../index'

const __filename = fileURLToPath(import.meta.url)
const badjs = resolve(__filename, '../fixtures/ssrModuleLoader-bad.js')
const THROW_MESSAGE = 'it is an expected error'

test('always throw error when evaluating an wrong SSR module', async () => {
  const viteServer = await createServer()
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const expectedErrors = []
  for (const _ of [0, 1]) {
    try {
      await viteServer.ssrLoadModule(badjs, { fixStacktrace: true })
    } catch (e) {
      expectedErrors.push(e)
    }
  }
  await viteServer.close()
  expect(expectedErrors).toHaveLength(2)
  expect(expectedErrors[0]).toBe(expectedErrors[1])
  expectedErrors.forEach((error) => {
    expect(error?.message).toContain(THROW_MESSAGE)
  })
  expect(spy).toBeCalledTimes(1)
  const [firstParameter] = spy.mock.calls[0]
  expect(firstParameter).toContain('Error when evaluating SSR module')
  expect(firstParameter).toContain(THROW_MESSAGE)
  spy.mockClear()
})
