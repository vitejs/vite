import fsp from 'node:fs/promises'
import path from 'node:path'
import type {
  Server as HttpServer,
  OutgoingHttpHeaders as HttpServerHeaders,
} from 'node:http'
import type { ServerOptions as HttpsServerOptions } from 'node:https'
import type { Connect } from 'dep-types/connect'
import colors from 'picocolors'
import { isObject } from './utils'
import type { ProxyOptions } from './server/middlewares/proxy'
import type { Logger } from './logger'

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
   * Enable TLS + HTTP/2.
   * Note: this downgrades to TLS only when the proxy option is also used.
   */
  https?: boolean | HttpsServerOptions
  /**
   * Open browser window on startup
   */
  open?: boolean | string
  /**
   * Configure custom proxy rules for the dev server. Expects an object
   * of `{ key: options }` pairs.
   * Uses [`http-proxy`](https://github.com/http-party/node-http-proxy).
   * Full options [here](https://github.com/http-party/node-http-proxy#options).
   *
   * Example `vite.config.js`:
   * ``` js
   * module.exports = {
   *   proxy: {
   *     // string shorthand
   *     '/foo': 'http://localhost:4567/foo',
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
   * Set to `true` to allow all methods from any origin, or configure separately
   * using an object.
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
  origin?:
    | CorsOrigin
    | ((origin: string, cb: (err: Error, origins: CorsOrigin) => void) => void)
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
  { proxy }: CommonServerOptions,
  app: Connect.Server,
  httpsOptions?: HttpsServerOptions,
): Promise<HttpServer> {
  if (!httpsOptions) {
    const { createServer } = await import('node:http')
    return createServer(app)
  }

  // #484 fallback to http1 when proxy is needed.
  if (proxy) {
    const { createServer } = await import('node:https')
    return createServer(httpsOptions, app)
  } else {
    const { createSecureServer } = await import('node:http2')
    return createSecureServer(
      {
        // Manually increase the session memory to prevent 502 ENHANCE_YOUR_CALM
        // errors on large numbers of requests
        maxSessionMemory: 1000,
        ...httpsOptions,
        allowHTTP1: true,
      },
      // @ts-expect-error TODO: is this correct?
      app,
    ) as unknown as HttpServer
  }
}

export async function resolveHttpsConfig(
  https: boolean | HttpsServerOptions | undefined,
): Promise<HttpsServerOptions | undefined> {
  if (!https) return undefined
  if (!isObject(https)) return {}

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
    try {
      return fsp.readFile(path.resolve(value))
    } catch (e) {
      return value
    }
  }
  return value
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
            'See https://vitejs.dev/guide/troubleshooting.html#_431-request-header-fields-too-large.',
        ),
      )
    }
    if ((err as any).code === 'ECONNRESET' || !socket.writable) {
      return
    }
    socket.end(`HTTP/1.1 ${msg}\r\n\r\n`)
  })
}
