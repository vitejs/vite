import type * as http from 'node:http'
import httpProxy from 'http-proxy'
import type { Connect } from 'dep-types/connect'
import type { HttpProxy } from 'dep-types/http-proxy'
import colors from 'picocolors'
import { HMR_HEADER } from '../ws'
import { createDebugger, isObject } from '../../utils'
import type { CommonServerOptions, ResolvedConfig } from '../..'

const debug = createDebugger('vite:proxy')

export interface ProxyRetryOptions {
  /**
   * how often to try the request (including the initial one)
   * @default 60
   */
  maxTries?: number
  /**
   * initial delay (in milliseconds) before next attempt
   * @default 1000
   */
  delay?: number
  /**
   * maximum delay (in milliseconds) before next attempt
   * @default 30000
   */
  maxDelay?: number
  /**
   * whether to use exponential backoff after failed attempts
   * @default false
   */
  backoff?: boolean
}

export interface ProxyOptions extends HttpProxy.ServerOptions {
  /**
   * rewrite path
   */
  rewrite?: (path: string) => string
  /**
   * configure the proxy server (e.g. listen to events)
   */
  configure?: (proxy: HttpProxy.Server, options: ProxyOptions) => void
  /**
   * webpack-dev-server style bypass function
   */
  bypass?: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    options: ProxyOptions
  ) => void | null | undefined | false | string
  /**
   * whether to retry failed requests
   */
  retry?: boolean | ProxyRetryOptions
}

export function proxyMiddleware(
  httpServer: http.Server | null,
  options: NonNullable<CommonServerOptions['proxy']>,
  config: ResolvedConfig
): Connect.NextHandleFunction {
  // lazy require only when proxy is used
  const proxies: Record<string, [HttpProxy.Server, ProxyOptions]> = {}

  Object.keys(options).forEach((context) => {
    let opts = options[context]
    if (!opts) {
      return
    }
    if (typeof opts === 'string') {
      opts = { target: opts, changeOrigin: true } as ProxyOptions
    }
    const proxy = httpProxy.createProxyServer(opts) as HttpProxy.Server

    if (opts.configure) {
      opts.configure(proxy, opts)
    }
    // clone before saving because http-proxy mutates the options
    proxies[context] = [proxy, { ...opts }]
  })

  if (httpServer) {
    httpServer.on('upgrade', (req, socket, head) => {
      const url = req.url!
      for (const context in proxies) {
        if (doesProxyContextMatchUrl(context, url)) {
          const [proxy, opts] = proxies[context]
          if (
            (opts.ws ||
              opts.target?.toString().startsWith('ws:') ||
              opts.target?.toString().startsWith('wss:')) &&
            req.headers['sec-websocket-protocol'] !== HMR_HEADER
          ) {
            if (opts.rewrite) {
              req.url = opts.rewrite(url)
            }
            debug(`${req.url} -> ws ${opts.target}`)

            proxy.ws(req, socket, head, undefined, (err, _req, res) => {
              config.logger.error(
                `${colors.red(`ws proxy error:`)}\n${err.stack}`,
                {
                  timestamp: true,
                  error: err
                }
              )
              res.end()
            })
            return
          }
        }
      }
    })
  }

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteProxyMiddleware(req, res, next) {
    const url = req.url!
    for (const context in proxies) {
      if (doesProxyContextMatchUrl(context, url)) {
        const [proxy, opts] = proxies[context]
        const options: HttpProxy.ServerOptions = {}

        if (opts.bypass) {
          const bypassResult = opts.bypass(req, res, opts)
          if (typeof bypassResult === 'string') {
            req.url = bypassResult
            debug(`bypass: ${req.url} -> ${bypassResult}`)
            return next()
          } else if (isObject(bypassResult)) {
            Object.assign(options, bypassResult)
            debug(`bypass: ${req.url} use modified options: %O`, options)
            return next()
          } else if (bypassResult === false) {
            debug(`bypass: ${req.url} -> 404`)
            return res.end(404)
          }
        }

        debug(`${req.url} -> ${opts.target || opts.forward}`)
        if (opts.rewrite) {
          req.url = opts.rewrite(req.url!)
        }

        const { maxTries, delay, maxDelay, backoff } = resolveRetryOptions(
          opts.retry
        )
        let attempt = 0
        let currentDelay = delay

        const run = () => {
          proxy.web(req, res, options, (err, _req, res) => {
            if (attempt + 1 < maxTries) {
              setTimeout(run, currentDelay)

              attempt++
              if (backoff) {
                currentDelay = Math.min(currentDelay * 2, maxDelay)
              }
              return
            }

            config.logger.error(
              `${colors.red(`http proxy error at ${res.req.url}:`)}\n${
                err.stack
              }`,
              {
                timestamp: true,
                error: err
              }
            )
            if (!res.headersSent && !res.writableEnded) {
              res
                .writeHead(500, {
                  'Content-Type': 'text/plain'
                })
                .end()
            }
          })
        }

        return run()
      }
    }
    next()
  }
}

function doesProxyContextMatchUrl(context: string, url: string): boolean {
  return (
    (context.startsWith('^') && new RegExp(context).test(url)) ||
    url.startsWith(context)
  )
}

const defaultRetryOptions: Required<ProxyRetryOptions> = {
  maxTries: 60,
  delay: 1_000,
  maxDelay: 30_000,
  backoff: false
}

function resolveRetryOptions(
  options?: boolean | ProxyRetryOptions
): Required<ProxyRetryOptions> {
  if (!options) {
    return {
      maxTries: 1,
      delay: 0,
      maxDelay: 0,
      backoff: false
    }
  }

  if (options === true) {
    return defaultRetryOptions
  }

  return {
    maxTries: options.maxTries ?? defaultRetryOptions.maxTries,
    delay: options.delay ?? defaultRetryOptions.delay,
    maxDelay: options.maxDelay ?? defaultRetryOptions.maxDelay,
    backoff: options.backoff ?? defaultRetryOptions.backoff
  }
}
