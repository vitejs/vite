import http from 'node:http'
import { afterEach, describe, expect, test } from 'vitest'
import { createServer } from '..'
import type { ViteDevServer } from '..'

const BASE_PORT = 15181

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
    test('detects port conflict', async () => {
      await using _blockingServer = await createSimpleServer(
        BASE_PORT,
        'localhost',
      )

      viteServer = await createServer({
        root: import.meta.dirname,
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

      viteServer = await createServer({
        root: import.meta.dirname,
        logLevel: 'silent',
        server: { port: BASE_PORT, strictPort: false, ws: false },
      })
      await viteServer.listen()

      const address = viteServer.httpServer!.address()
      expect(address).toStrictEqual(
        expect.objectContaining({ port: BASE_PORT + 1 }),
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
        logLevel: 'silent',
        server: { port: BASE_PORT, strictPort: false, ws: false },
      })
      await viteServer.listen()

      const address = viteServer.httpServer!.address()
      expect(address).toStrictEqual(
        expect.objectContaining({ port: BASE_PORT + 1 }),
      )
    })

    test('wildcard check also runs after EADDRINUSE fallback', async () => {
      // localhost:n occupied
      // 0.0.0.0:n+1 occupied
      // => Vite should pick n+2

      await using _localhostServer = await createSimpleServer(
        BASE_PORT,
        'localhost',
      )
      await using _wildcardServer = await createSimpleServer(
        BASE_PORT + 1,
        '0.0.0.0',
      )

      viteServer = await createServer({
        root: import.meta.dirname,
        logLevel: 'silent',
        server: {
          port: BASE_PORT,
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

  test('throws error when port is blocked and strictPort is true', async () => {
    await using _blockingServer = await createSimpleServer(
      BASE_PORT,
      'localhost',
    )

    viteServer = await createServer({
      root: import.meta.dirname,
      logLevel: 'silent',
      server: { port: BASE_PORT, strictPort: true, ws: false },
    })

    await expect(viteServer.listen()).rejects.toThrow(
      `Port ${BASE_PORT} is already in use`,
    )
  })
})
