import { createServer } from '../../index'
import { resolve } from 'path'

const badjs = resolve(__dirname, './fixtures/ssrModuleLoader-bad.js')
const THROW_MESSAGE = 'it is an expected error'

test('always throw error when evaluating an wrong SSR module', async () => {
  const viteServer = await createServer()
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  const expectedErrors = []
  for (const i of [0, 1]) {
    try {
      await viteServer.ssrLoadModule(badjs)
    } catch (e) {
      expectedErrors.push(e)
    }
  }
  await viteServer.close()
  expect(expectedErrors).toHaveLength(2)
  expectedErrors.forEach((error) => {
    expect(error?.message).toContain(THROW_MESSAGE)
  })
  expect(spy).toBeCalledTimes(2)
  spy.mock.calls.forEach(([info]) => {
    expect(info).toContain('Error when evaluating SSR module')
    expect(info).toContain(THROW_MESSAGE)
  })
  spy.mockClear()
})
