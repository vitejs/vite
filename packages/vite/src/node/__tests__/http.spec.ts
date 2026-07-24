import http from 'node:http'
import net from 'node:net'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { wildcardHosts } from '../constants'
import { createServer } from '..'
import type { InlineConfig, ViteDevServer } from '..'

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
        optimizeDeps,
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

  test('allows binding to specific host with strictPort when wildcard port is in use', async () => {
    await using _wildcardServer = await createSimpleServer(BASE_PORT, '0.0.0.0')

    const warnMessages: string[] = []
    viteServer = await createServer({
      root: import.meta.dirname,
      optimizeDeps,
      customLogger: {
        info: () => {},
        warn: (msg) => warnMessages.push(msg),
        warnOnce: () => {},
        error: () => {},
        clearScreen: () => {},
        hasErrorLogged: () => false,
        hasWarned: false,
      },
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
    expect(warnMessages).toContainEqual(expect.stringContaining('wildcard'))
  })
})

// Self-signed certificate for HTTPS + proxy coexistence tests (PR #20869).
// Generated with: openssl req -x509 -newkey rsa:2048 -days 36500 -nodes \
//   -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"
const TEST_CERT = `-----BEGIN CERTIFICATE-----
MIIDOjCCAiKgAwIBAgIURwLyJ6H1gdm/vSng8zTsWfIFrcYwDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MCAXDTI2MDcyNDA4MzMwMFoYDzIxMjYw
NjMwMDgzMzAwWjAUMRIwEAYDVQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQCz17JAFQEP6dldprscRvMkVt7YtIRjR08vgrRMxqRZ
BXWxqB5ImY/jEHXcAi+P8qrmb/CtWDgjBrMhxjiTwGtJgUa317XuYaOukN5HBEDm
Zd+OvhbugPTQPfDrIY4aKj8hYRy/54Fx1UpdYSOO5ZbXpRgcNlSlT7T2Q1evA+1N
NUkx+3U2b5BrszVG2+SopmqtxHjtimuZSeC6PyGpZHMWjNR8tthmtWTgGm7GCe0H
QG+u1gcnvfpIlSwR2oLcoiUgbaFM30oqcHfm73qtPw0Fv7z5b0uUnId8TMgSlFFJ
hqZZA6SUSnBbBRxeKeBVYqYPrTzV0U7/y2cMQYm0f82dAgMBAAGjgYEwfzAdBgNV
HQ4EFgQUt93CQYb8orySo0Etb6mhigDd3EYwHwYDVR0jBBgwFoAUt93CQYb8oryS
o0Etb6mhigDd3EYwDwYDVR0TAQH/BAUwAwEB/zAsBgNVHREEJTAjgglsb2NhbGhv
c3SHBH8AAAGHEAAAAAAAAAAAAAAAAAAAAAEwDQYJKoZIhvcNAQELBQADggEBAG0C
eJDmmgCjvAg9hnYIXD7kaeK7P93uB9ViE/VndIEfshrK6pzrGmCI0IW1ci5S8TQp
qcMwEuxB53FocATOlWX081DY49zWqWhF3GEZ+b7JrZVkiDgV18MvTgPa/VQQYFAu
NBiCxLDyCGf+2zee5Lj6caTLaXEp4atF2AewFT3B/APuxnMkDkIbCwXAb6Si3Ryw
fcLIUx0/z0Z5yQwcwpa2OVsyi/3FkZkZvoNXdLLp0uGZiaGE0WS57iLrWnpcaB6R
WlaeKzTWRcZRZ8x9MbrM6TjvaEIpFVgrUCBl1zHMlgdzMyvA385SjdRmOU2P2lBh
LVImOU50DjaJBvHxovk=
-----END CERTIFICATE-----`

const TEST_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCz17JAFQEP6dld
prscRvMkVt7YtIRjR08vgrRMxqRZBXWxqB5ImY/jEHXcAi+P8qrmb/CtWDgjBrMh
xjiTwGtJgUa317XuYaOukN5HBEDmZd+OvhbugPTQPfDrIY4aKj8hYRy/54Fx1Upd
YSOO5ZbXpRgcNlSlT7T2Q1evA+1NNUkx+3U2b5BrszVG2+SopmqtxHjtimuZSeC6
PyGpZHMWjNR8tthmtWTgGm7GCe0HQG+u1gcnvfpIlSwR2oLcoiUgbaFM30oqcHfm
73qtPw0Fv7z5b0uUnId8TMgSlFFJhqZZA6SUSnBbBRxeKeBVYqYPrTzV0U7/y2cM
QYm0f82dAgMBAAECggEADecYeOBmzZ52rEkNtpjm26H6O5HGQ4/UAkiTZvVa59Ax
PK5SG6tWC+f42deIFROzEc9eMWMG1pus+2kXH0JFHlCScUyJXEf2CbJZ90QlPupp
3DS7vG0BqpuEkANvDdIYQUdVm/bp8y0u64XCjvMWtHhRzdSGufotyMqEm8YCRpvn
uELlUrLyn7VG8yEY1m4B2i34DPM79bMNJyL3SJmN3T23W0rM33iA57ddNiYjm5L2
JBNIofTIkDGscnt2hJZyzNNg2aNm8TOkE4lG3ORNJxbki7b55TOkfk2/tzH6ekml
YOPIn53uY2AKF4FrmH0b4lbhzHi2K6HrFFcc1v7zYQKBgQDh6kT7uXurBcpq/iPI
uGWqxFMDHmKgbntQ2csWtA94MLPoOQgyd+thnLebFzHSYOpz9XGRTsDQ53wzgSXN
slUjf2ledkxVuqVsYoVbkln27OOTP5eZvFrHJuVs4e0mDAoEC9H/88yaC6/TWvGV
rlSlCYJ/ecZaQV+XtEh0LYWh+QKBgQDLysFtQ3hRZbZUDs9SHQNgJhZ6dka46Zsy
mz0P6lMe5vJPIjTyluHX/6331haFP4NSoiCY0Z/OoRKsQfOZqF+7tz2cnJZCrTUt
R2hMkr4tHm7NNYvi4hmLjLiw7MGyV855pgzuwCD2oiV+h5ToRqRpcjpc+02jujkC
LiQ+gFWxxQKBgQC44H6TgbcyvgpohJHEMSMCHKfSZYtQvxkrkRAiBDikozaXVBTh
OEHoH9ghk1myUJ2NR88omsowKz/45jeJnecOpbYVF7pgbd3yVK3NwnbdG/8hAWmO
5hVj5PDbqgfomvGXXhT84QcPCYFZ9ZK+a2vZo26n43/vXJBeFas1aAt0AQKBgC1a
ZSuk3Uz4HticJyV2EX8/WrdMRTb3vjNH+xHkqzTwXrKfwTrPu1kvrI7AVWi4Fsi4
DhsUY8U/cYFmeAkVQKDtCcglzQbvtyrpflu0OKCf6ja/GO+YM+krmxq8xeqjwe6u
tqgXl/5rXX7IO6pptkNFSZnRz5iFZBSJIkXKl8elAoGBAIIgeCK4MB+0NJQuUPF0
PDI8MCC3Trj/EK0KfwgaGFk+j9jkuHmQ9SZPVlSjlwaZP6haTeMrdiucS6/O2nTC
1AxPE93Ns/xrQrOawoiPkBYkuE2AZaCTRWipXRgRGmJgAks/dFgOGD7tiNlGKCt3
nFcoELjS7IoZJS9ONMkF4ema
-----END PRIVATE KEY-----`

describe('https + proxy', () => {
  let viteServer: ViteDevServer | null = null
  let backend: http.Server | null = null

  afterEach(async () => {
    if (viteServer) {
      await viteServer.close()
      viteServer = null
    }
    if (backend) {
      await new Promise<void>((resolve) => backend!.close(() => resolve()))
      backend = null
    }
  })

  test('supports HTTPS (HTTP/2) and proxy simultaneously', async () => {
    // Start a plain HTTP backend that the proxy will forward to
    backend = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('backend:/test')
    })
    await new Promise<void>((resolve) =>
      backend!.listen(0, '127.0.0.1', resolve),
    )
    const backendPort = (backend.address() as net.AddressInfo).port
    const backendUrl = `http://127.0.0.1:${backendPort}`

    // Create a Vite dev server with both HTTPS and proxy enabled.
    // Before PR #20869, this would downgrade to TLS-only (HTTP/1) because
    // http-proxy didn't support HTTP/2 servers. With http-proxy-3, both
    // work together.
    viteServer = await createServer({
      root: import.meta.dirname,
      optimizeDeps,
      logLevel: 'silent',
      server: {
        port: BASE_PORT + 10,
        strictPort: true,
        ws: false,
        https: { cert: TEST_CERT, key: TEST_KEY },
        proxy: {
          '/api': {
            target: backendUrl,
            changeOrigin: true,
          },
        },
      },
    })
    await viteServer.listen()

    // Verify the server is using HTTP/2 (not downgraded to HTTP/1).
    // Before PR #20868, using https + proxy would fall back to a plain
    // https.createServer (HTTP/1) instead of http2.createSecureServer.
    const httpServer = viteServer.httpServer!
    expect(httpServer.constructor.name).toBe('Http2SecureServer')

    // Verify proxy works through the HTTP/2 server.
    // Use http2 client to verify HTTP/2 is actually negotiated.
    const h2 = await import('node:http2')
    const port = (httpServer.address() as net.AddressInfo).port
    const client = h2.connect(`https://localhost:${port}`, {
      rejectUnauthorized: false,
    })

    // Wait for the client to connect before sending the request
    await new Promise<void>((resolve, reject) => {
      client.on('connect', resolve)
      client.on('error', reject)
    })

    const res = await new Promise<{ status: number; body: string }>(
      (resolve, reject) => {
        const req = client.request({ ':path': '/api/test' })
        req.on('response', (headers) => {
          let body = ''
          req.on('data', (chunk: Buffer) => (body += chunk.toString()))
          req.on('end', () => resolve({ status: headers[':status']!, body }))
        })
        req.on('error', reject)
        req.end()
      },
    )

    client.close()

    expect(res.status).toBe(200)
    expect(res.body).toBe('backend:/test')
  })
})
