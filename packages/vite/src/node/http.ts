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

/**
 * Check if a port is in use by attempting to connect to it.
 * This helps detect when another server is listening on 0.0.0.0
 * even if we're trying to bind to a specific interface.
 */
async function isPortInUse(port: number, host: string | undefined): Promise<boolean> {
  // Hosts to check - always check 0.0.0.0 in addition to the target host
  // to prevent port hijacking (see #10638)
  const hostsToCheck = new Set<string>()
  
  // Always check the wildcard address
  hostsToCheck.add('0.0.0.0')
  
  // Also check the target host if specified
  if (host && host !== '0.0.0.0') {
    hostsToCheck.add(host)
  }
  
  // Check localhost variants if binding to localhost
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    hostsToCheck.add('127.0.0.1')
  }

  for (const checkHost of hostsToCheck) {
    const inUse = await new Promise<boolean>((resolve) => {
      const socket = new net.Socket()
      
      socket.setTimeout(100)
      
      socket.on('connect', () => {
        socket.destroy()
        resolve(true)
      })
      
      socket.on('timeout', () => {
        socket.destroy()
        resolve(false)
      })
      
      socket.on('error', () => {
        socket.destroy()
        resolve(false)
      })
      
      socket.connect(port, checkHost)
    })
    
    if (inUse) {
      return true
    }
  }
  
  return false
}

export async function httpServerStart(
  httpServer: HttpServer,
  serverOptions: {
    port: number
    strictPort: boolean | undefined
    host: string | undefined
    logger: Logger
  },
): Promise<number> {
  let { port, strictPort, host, logger } = serverOptions

  // Check if port is in use on any interface before trying to bind
  // This catches cases where another server is on 0.0.0.0 but we're
  // trying to bind to localhost (see #10638)
  while (await isPortInUse(port, host)) {
    if (strictPort) {
      throw new Error(`Port ${port} is already in use`)
    }
    logger.info(`Port ${port} is in use, trying another one...`)
    port++
  }

  return new Promise((resolve, reject) => {
    const onError = (e: Error & { code?: string }) => {
      if (e.code === 'EADDRINUSE') {
        if (strictPort) {
          httpServer.removeListener('error', onError)
          reject(new Error(`Port ${port} is already in use`))
        } else {
          logger.info(`Port ${port} is in use, trying another one...`)
          httpServer.listen(++port, host)
        }
      } else {
        httpServer.removeListener('error', onError)
        reject(e)
      }
    }

    httpServer.on('error', onError)

    httpServer.listen(port, host, () => {
      httpServer.removeListener('error', onError)
      resolve(port)
    })
  })
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
