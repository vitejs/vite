import { afterEach, describe, expect, test } from 'vitest'
import { createServer } from '../../server'

describe('clientInjections: server.ws sentinels', () => {
  const servers: Awaited<ReturnType<typeof createServer>>[] = []

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()))
  })

  async function injectClient(ws: Record<string, unknown>) {
    const server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'silent',
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { middlewareMode: true, ws },
    })
    servers.push(server)
    const code =
      (await server.environments.client.transformRequest('/@vite/client'))
        ?.code ?? ''
    return {
      timeout: Number(code.match(/const hmrTimeout = (-?\d+)/)?.[1]),
      port: code.match(/const hmrPort = ([^\n]+)/)?.[1]?.trim().replace(/;$/, ''),
      direct: code
        .match(/const directSocketHost = ([^\n]+)/)?.[1]
        ?.trim()
        .replace(/;$/, ''),
      resolved: server.config.server.ws,
    }
  }

  test('timeout: 0 is injected instead of the 30000 default', async () => {
    const { timeout, resolved } = await injectClient({ timeout: 0 })
    expect(resolved).toMatchObject({ timeout: 0 })
    expect(timeout).toBe(0)
  })

  test('hmr.timeout: 0 is synced to ws and injected as 0', async () => {
    const server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'silent',
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { middlewareMode: true, hmr: { timeout: 0 } },
    })
    servers.push(server)
    const code =
      (await server.environments.client.transformRequest('/@vite/client'))
        ?.code ?? ''
    expect(server.config.server.ws).toMatchObject({ timeout: 0 })
    expect(Number(code.match(/const hmrTimeout = (-?\d+)/)?.[1])).toBe(0)
  })

  test('port: 0 is injected instead of the middleware 24678 default', async () => {
    const { port, resolved } = await injectClient({ port: 0 })
    expect(resolved).toMatchObject({ port: 0 })
    expect(port).toBe('0')
  })

  test('clientPort: 0 is injected instead of falling through to 24678', async () => {
    const { port, resolved } = await injectClient({ clientPort: 0 })
    expect(resolved).toMatchObject({ clientPort: 0 })
    expect(port).toBe('0')
  })

  test('direct target keeps port: 0 instead of the HTTP server port', async () => {
    const { direct, resolved } = await injectClient({ port: 0 })
    expect(resolved).toMatchObject({ port: 0 })
    expect(direct).toMatch(/:0\//)
  })

  test('clientPort still overrides port: 0', async () => {
    const { port } = await injectClient({ port: 0, clientPort: 5173 })
    expect(port).toBe('5173')
  })
})
