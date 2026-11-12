import type { LoadResult } from 'rolldown'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { browserExternalId, optionalPeerDepId } from '../../plugins/resolve'
import { createServer } from '../../server'

describe('externalized module error stubs escape module names', () => {
  // If this payload is interpolated into the generated code without escaping,
  // it is executed and throws a distinguishable error.
  const specialCharacters =
    '${(() => { throw new Error("interpolated") })()}`"\'\\\n\r\u2028\u2029'
  const browserModule = `node:test${specialCharacters}`
  const peerDep = `peer${specialCharacters}`
  const parentDep = `parent${specialCharacters}`

  async function createTestServer(isProduction = false) {
    vi.stubEnv('NODE_ENV', isProduction ? 'production' : 'development')
    onTestFinished(() => {
      vi.unstubAllEnvs()
    })
    const server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'error',
      server: {
        middlewareMode: true,
        ws: false,
      },
    })
    onTestFinished(() => server.close())
    return server
  }

  // Evaluate ESM and CJS stubs synchronously to avoid probing proxy exports for `.then`.
  function evaluateStub(result: LoadResult) {
    const code = typeof result === 'string' ? result : result!.code
    const module = { exports: {} as Record<string, unknown> }
    new Function('module', code.replace('export default', 'module.exports ='))(
      module,
    )
    return module.exports
  }

  test('browser external module stub is escaped (dev server load)', async () => {
    const server = await createTestServer()
    const result = await server.environments.client.pluginContainer.load(
      `${browserExternalId}:${browserModule}`,
    )
    const stub = evaluateStub(result)
    expect(() => stub.test).toThrow(
      new Error(
        `Module "${browserModule}" has been externalized for browser compatibility. Cannot access "${browserModule}.test" in client code.  See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.`,
      ),
    )
  })

  test('optional peer dep module stub is escaped (dev server)', async () => {
    const server = await createTestServer()
    const loadResult = await server.environments.client.pluginContainer.load(
      `${optionalPeerDepId}:${peerDep}:${parentDep}`,
    )
    expect(() => evaluateStub(loadResult)).toThrow(
      new Error(`Could not resolve "${peerDep}" imported by "${parentDep}".`),
    )
  })

  test('production stubs are escaped', async () => {
    const server = await createTestServer(true)
    const container = server.environments.client.pluginContainer

    expect(
      evaluateStub(
        await container.load(`${browserExternalId}:${browserModule}`),
      ),
    ).toStrictEqual({})
    const code = await container.load(
      `${optionalPeerDepId}:${peerDep}:${parentDep}`,
    )
    expect(() => evaluateStub(code)).toThrow(
      new Error(
        `Could not resolve "${peerDep}" imported by "${parentDep}". Is it installed?`,
      ),
    )
  })
})
