import fsp from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import type { OutgoingHttpHeaders as HttpServerHeaders } from 'node:http'
import type { ServerOptions as HttpsServerOptions } from 'node:https'
import colors from 'picocolors'
import type { Connect } from '#dep-types/connect'
import type { ProxyOptions } from './server/middlewares/proxy'
import type { Logger } from './logger'
import type { HttpServer } from './server'
import { wildcardHosts } from './constants'

export interface CommonServerOptions {
  /**
   * Specify server port. Note if the port is already being used, Vite will
   * automatically try the next available port so this may not be the actual
   * port the server ends up listening on.
   */
  port?: number
  /**
   * If enabled, vite will exit if specified port is already in use
   */
  strictPort?: boolean
  /**
   * Specify which IP addresses the server should listen on.
   * Set to 0.0.0.0 to listen on all addresses, including LAN and public addresses.
   */
  host?: string | boolean
  /**
   * The hostnames that Vite is allowed to respond to.
   * `localhost` and subdomains under `.localhost` and all IP addresses are allowed by default.
   * When using HTTPS, this check is skipped.
   *
   * If a string starts with `.`, it will allow that hostname without the `.` and all subdomains under the hostname.
   * For example, `.example.com` will allow `example.com`, `foo.example.com`, and `foo.bar.example.com`.
   *
   * If set to `true`, the server is allowed to respond to requests for any hosts.
   * This is not recommended as it will be vulnerable to DNS rebinding attacks.
   */
  allowedHosts?: string[] | true
  /**
   * Enable TLS + HTTP/2.
   * Note: this downgrades to TLS only when the proxy option is also used.
   */
  https?: HttpsServerOptions
  /**
   * Open browser window on startup
   */
  open?: boolean | string
  /**
   * Configure custom proxy rules for the dev server. Expects an object
   * of `{ key: options }` pairs.
   * Uses [`http-proxy-3`](https://github.com/sagemathinc/http-proxy-3).
   * Full options [here](https://github.com/sagemathinc/http-proxy-3#options).
   *
   * Example `vite.config.js`:
   * ``` js
   * module.exports = {
   *   proxy: {
   *     // string shorthand: /foo -> http://localhost:4567/foo
   *     '/foo': 'http://localhost:4567',
   *     // with options
   *     '/api': {
   *       target: 'http://jsonplaceholder.typicode.com',
   *       changeOrigin: true,
   *       rewrite: path => path.replace(/^\/api/, '')
   *     }
   *   }
   * }
   * ```
   */
  proxy?: Record<string, string | ProxyOptions>
  /**
   * Configure CORS for the dev server.
   * Uses https://github.com/expressjs/cors.
   *
   * When enabling this option, **we recommend setting a specific value
   * rather than `true`** to avoid exposing the source code to untrusted origins.
   *
   * Set to `true` to allow all methods from any origin, or configure separately
   * using an object.
   *
   * @default false
   */
  cors?: CorsOptions | boolean
  /**
   * Specify server response headers.
   */
  headers?: HttpServerHeaders
}

/**
 * https://github.com/expressjs/cors#configuration-options
 */
export interface CorsOptions {
  /**
   * Configures the Access-Control-Allow-Origin CORS header.
   *
   * **We recommend setting a specific value rather than
   * `true`** to avoid exposing the source code to untrusted origins.
   */
  origin?:
    | CorsOrigin
    | ((
        origin: string | undefined,
        cb: (err: Error, origins: CorsOrigin) => void,
      ) => void)
  methods?: string | string[]
  allowedHeaders?: string | string[]
  exposedHeaders?: string | string[]
  credentials?: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

export type CorsOrigin = boolean | string | RegExp | (string | RegExp)[]

export async function resolveHttpServer(
  app: Connect.Server,
  httpsOptions?: HttpsServerOptions,
): Promise<HttpServer> {
  if (!httpsOptions) {
    const { createServer } = await import('node:http')
    return createServer(app)
  }

  const { createSecureServer } = await import('node:http2')
  return createSecureServer(
    {
      // Manually increase the session memory to prevent 502 ENHANCE_YOUR_CALM
      // errors on large numbers of requests
      maxSessionMemory: 1000,
      // Increase the stream reset rate limit to prevent net::ERR_HTTP2_PROTOCOL_ERROR
      // errors on large numbers of requests
      streamResetBurst: 100000,
      streamResetRate: 33,
      ...httpsOptions,
      allowHTTP1: true,
    },
    // @ts-expect-error TODO: is this correct?
    app,
  )
}

export async function resolveHttpsConfig(
  https: HttpsServerOptions | undefined,
): Promise<HttpsServerOptions | undefined> {
  if (!https) return undefined

  const [ca, cert, key, pfx] = await Promise.all([
    readFileIfExists(https.ca),
    readFileIfExists(https.cert),
    readFileIfExists(https.key),
    readFileIfExists(https.pfx),
  ])
  return { ...https, ca, cert, key, pfx }
}

async function readFileIfExists(value?: string | Buffer | any[]) {
  if (typeof value === 'string') {
    return fsp.readFile(path.resolve(value)).catch(() => value)
  }
  return value
}

// Check if a port is available on wildcard addresses (0.0.0.0, ::)
async function isPortAvailable(port: number): Promise<boolean> {
  for (const host of wildcardHosts) {
    // Gracefully handle errors (e.g., IPv6 disabled on the system)
    const available = await tryListen(port, host).catch(() => true)
    if (!available) return false
  }
  return true
}

function tryListen(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => {
      // Ensure server is closed even on error to prevent resource leaks
      server.close(() => resolve(false))
    })
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port, host)
  })
}

async function tryBindServer(
  httpServer: HttpServer,
  port: number,
  host: string | undefined,
): Promise<
  { success: true } | { success: false; error: Error & { code?: string } }
> {
  return new Promise((resolve) => {
    const onError = (e: Error & { code?: string }) => {
      httpServer.off('error', onError)
      httpServer.off('listening', onListening)
      resolve({ success: false, error: e })
    }
    const onListening = () => {
      httpServer.off('error', onError)
      httpServer.off('listening', onListening)
      resolve({ success: true })
    }

    httpServer.on('error', onError)
    httpServer.on('listening', onListening)

    httpServer.listen(port, host)
  })
}

const MAX_PORT = 65535

export async function httpServerStart(
  httpServer: HttpServer,
  serverOptions: {
    port: number
    strictPort: boolean | undefined
    host: string | undefined
    logger: Logger
  },
): Promise<number> {
  const { port: startPort, strictPort, host, logger } = serverOptions

  for (let port = startPort; port <= MAX_PORT; port++) {
    // Pre-check port availability on wildcard addresses (0.0.0.0, ::)
    // so that we avoid conflicts with other servers listening on all interfaces
    if (await isPortAvailable(port)) {
      const result = await tryBindServer(httpServer, port, host)
      if (result.success) {
        return port
      }
      if (result.error.code !== 'EADDRINUSE') {
        throw result.error
      }
    }

    if (strictPort) {
      throw new Error(`Port ${port} is already in use`)
    }

    logger.info(`Port ${port} is in use, trying another one...`)
  }
  throw new Error(
    `No available ports found between ${startPort} and ${MAX_PORT}`,
  )
}

export function setClientErrorHandler(
  server: HttpServer,
  logger: Logger,
): void {
  server.on('clientError', (err, socket) => {
    let msg = '400 Bad Request'
    if ((err as any).code === 'HPE_HEADER_OVERFLOW') {
      msg = '431 Request Header Fields Too Large'
      logger.warn(
        colors.yellow(
          'Server responded with status code 431. ' +
            'See https://vite.dev/guide/troubleshooting.html#_431-request-header-fields-too-large.',
        ),
      )
    }
    if ((err as any).code === 'ECONNRESET' || !socket.writable) {
      return
    }
    socket.end(`HTTP/1.1 ${msg}\r\n\r\n`)
  })
}
