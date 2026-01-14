import http from 'node:http'
import { afterEach, describe, expect, test } from 'vitest'
import { createServer } from '..'
import type { ViteDevServer } from '..'

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

  describe('wildcard host detection', () => {
    test('wildcard check runs after EADDRINUSE fallback', async () => {
      // Reviewer scenario: localhost:port occupied, 0.0.0.0:port+1 occupied
      // Bug: after EADDRINUSE on port, Vite tries port+1 WITHOUT wildcard check
      const port = 15181

      // localhost:port occupied (will trigger EADDRINUSE when Vite tries to bind)
      const localhostServer = http.createServer()
      await new Promise<void>((resolve) => {
        localhostServer.listen(port, '127.0.0.1', resolve)
      })

      // 0.0.0.0:port+1 occupied (should be detected by wildcard check after EADDRINUSE)
      const wildcardServer = http.createServer()
      await new Promise<void>((resolve) => {
        wildcardServer.listen(port + 1, '0.0.0.0', resolve)
      })

      try {
        viteServer = await createServer({
          root: __dirname,
          logLevel: 'silent',
          server: { port, host: '127.0.0.1', strictPort: false, ws: false },
        })

        await viteServer.listen()

        // Expected flow:
        // 1. isPortAvailable(port) → checks 0.0.0.0:port → FREE → passes
        // 2. httpServer.listen(port, '127.0.0.1') → EADDRINUSE
        // 3. port++ → now port+1
        // 4. isPortAvailable(port+1) → checks 0.0.0.0:port+1 → OCCUPIED → fails
        // 5. port++ → now port+2
        // 6. isPortAvailable(port+2) → FREE → passes
        // 7. httpServer.listen(port+2, '127.0.0.1') → SUCCESS
        const address = viteServer.httpServer?.address()
        expect(address).toBeTruthy()
        if (typeof address === 'object' && address) {
          expect(address.port).toBe(port + 2)
        }
      } finally {
        // Cleanup servers
        await Promise.all([
          new Promise<void>((resolve) =>
            localhostServer.close(() => resolve()),
          ),
          new Promise<void>((resolve) => wildcardServer.close(() => resolve())),
        ])
      }
    })

    test('detects port conflict when server listens on 0.0.0.0', async () => {
      const port = 15173

      // Simulate another server (e.g., Next.js) listening on all interfaces
      blockingServer = http.createServer()
      await new Promise<void>((resolve) => {
        blockingServer!.listen(port, '0.0.0.0', resolve)
      })

      viteServer = await createServer({
        root: __dirname,
        logLevel: 'silent',
        server: { port, strictPort: false, ws: false },
      })

      await viteServer.listen()

      // Vite should detect the conflict and use a different port
      const address = viteServer.httpServer?.address()
      expect(address).toBeTruthy()
      if (typeof address === 'object' && address) {
        expect(address.port).toBe(port + 1)
      }
    })

    test('detects port conflict when server listens on :: (IPv6)', async () => {
      const port = 15174

      blockingServer = http.createServer()

      // Skip test if IPv6 is not available on this system
      try {
        await new Promise<void>((resolve, reject) => {
          blockingServer!.once('error', reject)
          blockingServer!.listen(port, '::', resolve)
        })
      } catch {
        return
      }

      viteServer = await createServer({
        root: __dirname,
        logLevel: 'silent',
        server: { port, strictPort: false, ws: false },
      })

      await viteServer.listen()

      const address = viteServer.httpServer?.address()
      expect(address).toBeTruthy()
      if (typeof address === 'object' && address) {
        expect(address.port).toBe(port + 1)
      }
    })
  })

  describe('port selection behavior', () => {
    test('finds first available port when multiple ports are blocked', async () => {
      const basePort = 15176
      const blockedCount = 3
      const blockingServers: http.Server[] = []

      // Block 3 consecutive ports
      for (let i = 0; i < blockedCount; i++) {
        const server = http.createServer()
        await new Promise<void>((resolve) => {
          server.listen(basePort + i, '0.0.0.0', resolve)
        })
        blockingServers.push(server)
      }

      viteServer = await createServer({
        root: __dirname,
        logLevel: 'silent',
        server: { port: basePort, strictPort: false, ws: false },
      })

      await viteServer.listen()

      const address = viteServer.httpServer?.address()
      expect(address).toBeTruthy()
      if (typeof address === 'object' && address) {
        expect(address.port).toBe(basePort + blockedCount)
      }

      // Cleanup additional blocking servers
      await Promise.all(
        blockingServers.map(
          (server) =>
            new Promise<void>((resolve) => server.close(() => resolve())),
        ),
      )
    })
  })

  describe('strictPort option', () => {
    test('throws error when port is blocked and strictPort is true', async () => {
      const port = 15179

      blockingServer = http.createServer()
      await new Promise<void>((resolve) => {
        blockingServer!.listen(port, '0.0.0.0', resolve)
      })

      viteServer = await createServer({
        root: __dirname,
        logLevel: 'silent',
        server: { port, strictPort: true, ws: false },
      })

      await expect(viteServer.listen()).rejects.toThrow(
        `Port ${port} is already in use`,
      )
    })
  })

  describe('backward compatibility', () => {
    test('EADDRINUSE fallback works for non-wildcard hosts', async () => {
      const port = 15180

      // Server on localhost only (not detected by wildcard pre-check)
      blockingServer = http.createServer()
      await new Promise<void>((resolve) => {
        blockingServer!.listen(port, '127.0.0.1', resolve)
      })

      // Force Vite to use the same host to trigger EADDRINUSE
      viteServer = await createServer({
        root: __dirname,
        logLevel: 'silent',
        server: { port, host: '127.0.0.1', strictPort: false, ws: false },
      })

      await viteServer.listen()

      // The existing EADDRINUSE handler should catch this
      const address = viteServer.httpServer?.address()
      expect(address).toBeTruthy()
      if (typeof address === 'object' && address) {
        expect(address.port).toBe(port + 1)
      }
    })
  })
})
