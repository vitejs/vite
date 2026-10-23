import http from 'node:http'
import net from 'node:net'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createServer } from '..'
import type { InlineConfig, ViteDevServer } from '..'
import { wildcardHosts } from '../constants'

const BASE_PORT = 15181

// `server.listen()` would otherwise start a dep scan that crawls every HTML fixture under `__tests__`
const optimizeDeps: InlineConfig['optimizeDeps'] = {
  noDiscovery: true,
  include: [],
}

describe('port detection', () => {
  let blockingServer: http.Server | null = null
  let viteServer: ViteDevServer | null = null

  afterEach(async () => {
    if (viteServer) {
      await viteServer.close()
      viteServer = null
    }

    await new Promise<void>((resolve) => {
      if (blockingServer) {
        blockingServer.close(() => resolve())
        blockingServer = null
      } else {
        resolve()
      }
    })
  })

  async function createSimpleServer(port: number, host: string) {
    const server = http.createServer()
    await new Promise<void>((resolve) => {
      server.listen(port, host, () => resolve())
    })
    return {
      [Symbol.asyncDispose]() {
        return new Promise<void>((resolve) => {
          server.close(() => resolve())
        })
      },
    }
  }

  describe('port fallback', () => {
    test('uses the same ephemeral port on every interface', async () => {
      using listen = vi.spyOn(net.Server.prototype, 'listen')

      viteServer = await createServer({
        root: import.meta.dirname,
        optimizeDeps,
        logLevel: 'silent',
        server: { port: 0, ws: false },
      })
      await viteServer.listen()

      const address = viteServer.httpServer!.address()
      expect(address).toStrictEqual(
        expect.objectContaining({ port: expect.any(Number) }),
      )
      const assignedPort = (address as net.AddressInfo).port
      expect(viteServer._currentServerPort).toBe(assignedPort)
      const [firstWildcardHost, ...remainingWildcardHosts] = wildcardHosts
      expect(
        listen.mock.calls.map(([port, host]) => ({ port, host })),
      ).toStrictEqual([
        { port: 0, host: firstWildcardHost },
        ...remainingWildcardHosts.map((host) => ({
          port: assignedPort,
          host,
        })),
        { port: assignedPort, host: 'localhost' }, // Check configured host
        { port: assignedPort, host: 'localhost' }, // Bind HTTP server
      ])
    })

    test('detects port conflict', async () => {
      await using _blockingServer = await createSimpleServer(
        BASE_PORT,
        'localhost',
      )

      viteServer = await createServer({
        root: import.meta.dirname,
        optimizeDeps,
        logLevel: 'silent',
        server: { port: BASE_PORT, strictPort: false, ws: false },
      })
      await viteServer.listen()

      const address = viteServer.httpServer!.address()
      expect(address).toStrictEqual(
        expect.objectContaining({ port: BASE_PORT + 1 }),
      )
    })

    test('detects multiple port conflict', async () => {
      await using _blockingServer1 = await createSimpleServer(
        BASE_PORT,
        'localhost',
      )
      await using _blockingServer2 = await createSimpleServer(
        BASE_PORT + 1,
        'localhost',
      )

      viteServer = await createServer({
        root: import.meta.dirname,
        optimizeDeps,
        logLevel: 'silent',
        server: { port: BASE_PORT, strictPort: false, ws: false },
      })
      await viteServer.listen()

      const address = viteServer.httpServer!.address()
      expect(address).toStrictEqual(
        expect.objectContaining({ port: BASE_PORT + 2 }),
      )
    })

    test('detects port conflict when server listens on 0.0.0.0', async () => {
      await using _blockingServer = await createSimpleServer(
        BASE_PORT,
        '0.0.0.0',
      )

      // Use a non-loopback host so the wildcard probe still runs.
      viteServer = await createServer({
        root: import.meta.dirname,
        optimizeDeps,
        logLevel: 'silent',
        server: {
          port: BASE_PORT,
          host: '0.0.0.0',
          strictPort: false,
          ws: false,
        },
      })
      await viteServer.listen()

      const address = viteServer.httpServer!.address()
      expect(address).toStrictEqual(
        expect.objectContaining({ port: BASE_PORT + 1 }),
      )
    })

    test('loopback host can share a port number occupied on wildcard', async () => {
      await using _blockingServer = await createSimpleServer(
        BASE_PORT,
        '0.0.0.0',
      )

      viteServer = await createServer({
        root: import.meta.dirname,
        optimizeDeps,
        logLevel: 'silent',
        server: {
          port: BASE_PORT,
          host: '127.0.0.1',
          strictPort: false,
          ws: false,
        },
      })
      await viteServer.listen()

      // Loopback skips the wildcard listen probe, so 127.0.0.1:port is used
      // even when 0.0.0.0:port is already taken.
      const address = viteServer.httpServer!.address()
      expect(address).toStrictEqual(
        expect.objectContaining({ port: BASE_PORT }),
      )
    })

    test('detects port conflict when server listens on :: (IPv6)', async (ctx) => {
      let blockingServer
      try {
        blockingServer = await createSimpleServer(BASE_PORT, '::')
      } catch {
        // Skip test if IPv6 is not available on this system
        ctx.skip()
        return
      }
      await using _blockingServer = blockingServer

      viteServer = await createServer({
        root: import.meta.dirname,
        optimizeDeps,
        logLevel: 'silent',
        server: {
          port: BASE_PORT,
          host: '::',
          strictPort: false,
          ws: false,
        },
      })
      await viteServer.listen()

      const address = viteServer.httpServer!.address()
      expect(address).toStrictEqual(
        expect.objectContaining({ port: BASE_PORT + 1 }),
      )
    })

    test('wildcard check also runs after EADDRINUSE fallback', async () => {
      // 0.0.0.0:n occupied
      // 0.0.0.0:n+1 occupied
      // => Vite bound to 0.0.0.0 should pick n+2

      await using _wildcardServer1 = await createSimpleServer(
        BASE_PORT,
        '0.0.0.0',
      )
      await using _wildcardServer2 = await createSimpleServer(
        BASE_PORT + 1,
        '0.0.0.0',
      )

      viteServer = await createServer({
        root: import.meta.dirname,
        optimizeDeps,
        logLevel: 'silent',
        server: {
          port: BASE_PORT,
          host: '0.0.0.0',
          strictPort: false,
          ws: false,
        },
      })
      await viteServer.listen()

      const address = viteServer.httpServer!.address()
      expect(address).toStrictEqual(
        expect.objectContaining({ port: BASE_PORT + 2 }),
      )
    })
  })

  test('non-EADDRINUSE errors on wildcard do not block port selection', async () => {
    const originalCreateServer = net.createServer.bind(net)
    using _ = vi.spyOn(net, 'createServer').mockImplementation(() => {
      const server = originalCreateServer()
      const originalListen = server.listen.bind(server)
      // @ts-expect-error this is the overload used internally
      server.listen = (
        port: number,
        host: string,
        ...args: unknown[]
      ): net.Server => {
        if (wildcardHosts.has(host)) {
          process.nextTick(() => {
            const err: NodeJS.ErrnoException = new Error(
              'listen EACCES: permission denied',
            )
            err.code = 'EACCES'
            server.emit('error', err)
          })
          return server
        }
        // @ts-expect-error this is the overload used internally
        return originalListen(port, host, ...args)
      }
      return server
    })

    viteServer = await createServer({
      root: import.meta.dirname,
      optimizeDeps,
      logLevel: 'silent',
      server: { port: BASE_PORT, strictPort: false, ws: false },
    })
    await viteServer.listen()

    const address = viteServer.httpServer!.address()
    expect(address).toStrictEqual(expect.objectContaining({ port: BASE_PORT }))
  })

  test('throws error when port is blocked and strictPort is true', async () => {
    await using _blockingServer = await createSimpleServer(
      BASE_PORT,
      'localhost',
    )

    viteServer = await createServer({
      root: import.meta.dirname,
      optimizeDeps,
      logLevel: 'silent',
      server: { port: BASE_PORT, strictPort: true, ws: false },
    })

    await expect(viteServer.listen()).rejects.toThrow(
      `Port ${BASE_PORT} is already in use`,
    )
  })

  test('allows binding to loopback with strictPort when wildcard port is in use', async () => {
    await using _wildcardServer = await createSimpleServer(BASE_PORT, '0.0.0.0')

    using listen = vi.spyOn(net.Server.prototype, 'listen')
    viteServer = await createServer({
      root: import.meta.dirname,
      optimizeDeps,
      logLevel: 'silent',
      server: {
        port: BASE_PORT,
        host: '127.0.0.1',
        strictPort: true,
        ws: false,
      },
    })

    try {
      await viteServer.listen()
    } catch (e) {
      // it may not be allowed to bind to specific host when wildcard port is in use
      expect(() => {
        throw e
      }).toThrow(`Port ${BASE_PORT} is already in use`)
      return
    }

    const address = viteServer.httpServer!.address()
    expect(address).toStrictEqual(expect.objectContaining({ port: BASE_PORT }))
    // Loopback hosts skip the wildcard listen probe (Windows Firewall).
    // https://github.com/vitejs/vite/issues/23766
    expect(
      listen.mock.calls.some(
        ([, host]) => typeof host === 'string' && wildcardHosts.has(host),
      ),
    ).toBe(false)
  })

  test('does not probe wildcard addresses when host is loopback', async () => {
    using listen = vi.spyOn(net.Server.prototype, 'listen')

    viteServer = await createServer({
      root: import.meta.dirname,
      optimizeDeps,
      logLevel: 'silent',
      server: {
        port: BASE_PORT,
        host: '127.0.0.1',
        strictPort: true,
        ws: false,
      },
    })
    await viteServer.listen()

    expect(
      listen.mock.calls.some(
        ([, host]) => typeof host === 'string' && wildcardHosts.has(host),
      ),
    ).toBe(false)
    expect(listen.mock.calls.some(([, host]) => host === '127.0.0.1')).toBe(
      true,
    )
  })

  describe('port reuse on restart', () => {
    test('reuses the OS-assigned port on restart when port is 0', async () => {
      viteServer = await createServer({
        root: import.meta.dirname,
        optimizeDeps,
        logLevel: 'silent',
        server: { port: 0, ws: false },
      })
      await viteServer.listen()

      const address = viteServer.httpServer!.address() as net.AddressInfo
      const assignedPort = address.port

      await viteServer.restart()

      expect(viteServer.httpServer!.address()).toStrictEqual(
        expect.objectContaining({ port: assignedPort }),
      )
    })

    test('reuses the listened port when retrying after a failed listen', async () => {
      await using blockingServer = await createSimpleServer(
        BASE_PORT,
        'localhost',
      )

      viteServer = await createServer({
        root: import.meta.dirname,
        optimizeDeps,
        logLevel: 'silent',
        server: { port: BASE_PORT, ws: false },
      })
      await viteServer.listen()

      const address = viteServer.httpServer!.address() as net.AddressInfo
      const assignedPort = address.port

      await blockingServer[Symbol.asyncDispose]()

      await viteServer.restart()

      expect(viteServer.httpServer!.address()).toStrictEqual(
        expect.objectContaining({ port: assignedPort }),
      )
    })
  })
})
