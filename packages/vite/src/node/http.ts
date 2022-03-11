import fs, { promises as fsp } from 'fs'
import * as http from 'http'
import os from 'os'
import type { NetworkInterfaceInfoIPv6 } from 'os'
import path from 'path'
import type {
  OutgoingHttpHeaders as HttpServerHeaders,
  Server as HttpServer
} from 'http'
import type { ServerOptions as HttpsServerOptions } from 'https'
import { isObject } from './utils'
import type { ProxyOptions } from './server/middlewares/proxy'
import type { Connect } from 'types/connect'
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
  httpsOptions?: HttpsServerOptions
): Promise<HttpServer> {
  if (!httpsOptions) {
    return require('http').createServer(app)
  }

  if (proxy) {
    // #484 fallback to http1 when proxy is needed.
    return require('https').createServer(httpsOptions, app)
  } else {
    return require('http2').createSecureServer(
      {
        ...httpsOptions,
        allowHTTP1: true
      },
      app
    )
  }
}

export async function resolveHttpsConfig(
  https: boolean | HttpsServerOptions | undefined,
  cacheDir: string
): Promise<HttpsServerOptions | undefined> {
  if (!https) return undefined

  const httpsOption = isObject(https) ? { ...https } : {}

  const { ca, cert, key, pfx } = httpsOption
  Object.assign(httpsOption, {
    ca: readFileIfExists(ca),
    cert: readFileIfExists(cert),
    key: readFileIfExists(key),
    pfx: readFileIfExists(pfx)
  })
  if (!httpsOption.key || !httpsOption.cert) {
    httpsOption.cert = httpsOption.key = await getCertificate(cacheDir)
  }
  return httpsOption
}

function readFileIfExists(value?: string | Buffer | any[]) {
  if (typeof value === 'string') {
    try {
      return fs.readFileSync(path.resolve(value))
    } catch (e) {
      return value
    }
  }
  return value
}

async function getCertificate(cacheDir: string) {
  const cachePath = path.join(cacheDir, '_cert.pem')

  try {
    const [stat, content] = await Promise.all([
      fsp.stat(cachePath),
      fsp.readFile(cachePath, 'utf8')
    ])

    if (Date.now() - stat.ctime.valueOf() > 30 * 24 * 60 * 60 * 1000) {
      throw new Error('cache is outdated.')
    }

    return content
  } catch {
    const content = (await import('./certificate')).createCertificate()
    fsp
      .mkdir(cacheDir, { recursive: true })
      .then(() => fsp.writeFile(cachePath, content))
      .catch(() => {})
    return content
  }
}

function getExternalHost() {
  const hosts: string[] = []
  Object.values(os.networkInterfaces())
    .flatMap((nInterface) => nInterface ?? [])
    .filter((detail) => detail && detail.address && detail.internal === false)
    .map((detail) => {
      let address = detail.address
      if (address.indexOf('fe80:') === 0) {
        // support ipv6 scope
        address += '%' + (detail as NetworkInterfaceInfoIPv6).scopeid
      }
      hosts.push(address)
    })
  return hosts
}

function createTestServer(port: number, host: string): Promise<string> {
  return new Promise(function (resolve, reject) {
    const server = http.createServer()
    server.listen(port, host, function () {
      server.once('close', function () {
        resolve(host)
      })
      server.close()
    })
    server.on('error', (e: Error & { code?: string }) => {
      if (e.code === 'EADDRINUSE') {
        reject(host)
      } else {
        reject(e)
      }
    })
  })
}

function getConflictHosts(host: string | undefined) {
  const externalHost = getExternalHost()
  const internalHost = ['127.0.0.1', '::1']
  const defaultHost = ['0.0.0.0', '::']
  let conflictIpList: string[] = []
  if (host === undefined || host === '::' || host === '0.0.0.0') {
    // User may want to listen on every IPs, we should check every IPs
    conflictIpList = [...externalHost, ...internalHost, ...defaultHost]
  } else if (host === '127.0.0.1' || host === 'localhost') {
    // User may want to listen on 127.0.0.1 and use localhost as the hostname.
    // check ::1 cause localhost may parse to ::1 first,::1 is reachable when ::1 or :: is in listening
    conflictIpList = ['127.0.0.1', '::1', '::']
  } else {
    // Only listen on specific address
    conflictIpList = [host]
  }
  return conflictIpList
}

// inspired by https://gist.github.com/eplawless/51afd77bc6e8631f6b5cb117208d5fe0#file-node-is-a-liar-snippet-4-js
async function checkHostsAndPortAvailable(hosts: string[], port: number) {
  const servers = hosts.reduce(function (
    lastServer: Promise<string> | null,
    host
  ) {
    return lastServer
      ? lastServer.then(function () {
          return createTestServer(port, host)
        })
      : createTestServer(port, host)
  },
  null)

  return servers
}

async function resolvePort(
  host: string | undefined,
  startPort: number,
  logger: Logger,
  strictPort?: boolean
) {
  const conflictIpList = getConflictHosts(host)
  return new Promise((resolve: (port: number) => void, reject) => {
    checkHostsAndPortAvailable(conflictIpList, startPort).then(
      () => {
        resolve(startPort)
      },
      (conflictHost: string | Error) => {
        if (typeof conflictHost !== 'string') {
          reject(conflictHost)
          return
        }
        if (strictPort) {
          logger.info(`Port ${startPort} is in use by ${conflictHost}`)
          reject(conflictHost)
        } else {
          logger.info(
            `Port ${startPort} is in use by ${conflictHost}, trying another one...`
          )
          resolvePort(host, startPort + 1, logger, strictPort).then(
            (port) => {
              resolve(port)
            },
            (e: Error) => {
              reject(e)
            }
          )
        }
      }
    )
  })
}

export async function httpServerStart(
  httpServer: HttpServer,
  serverOptions: {
    port: number
    strictPort: boolean | undefined
    host: string | undefined
    logger: Logger
  }
): Promise<number> {
  return new Promise((resolve, reject) => {
    let { port, strictPort, host, logger } = serverOptions

    resolvePort(host, port, logger, strictPort).then((availablePort) => {
      const onError = (e: Error & { code?: string }) => {
        reject(e)
      }

      httpServer.on('error', onError)

      httpServer.listen(availablePort, host, () => {
        httpServer.removeListener('error', onError)
        resolve(port)
      })
    }, reject)
  })
}
