import type * as http from 'node:http'
import type * as net from 'node:net'
import httpProxy from 'http-proxy'
import type { Connect } from 'dep-types/connect'
import type { HttpProxy } from 'dep-types/http-proxy'
import colors from 'picocolors'
import { createDebugger } from '../../utils'
import type { CommonServerOptions, ResolvedConfig } from '../..'
import type { HttpServer } from '..'

const debug = createDebugger('vite:proxy')

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
    /** undefined for WebSocket upgrade requests */
    res: http.ServerResponse | undefined,
    options: ProxyOptions,
  ) =>
    | void
    | null
    | undefined
    | false
    | string
    | Promise<void | null | undefined | boolean | string>
  /**
   * rewrite the Origin header of a WebSocket request to match the target
   *
   * **Exercise caution as rewriting the Origin can leave the proxying open to [CSRF attacks](https://owasp.org/www-community/attacks/csrf).**
   */
  rewriteWsOrigin?: boolean | undefined
}

const rewriteOriginHeader = (
  proxyReq: http.ClientRequest,
  options: ProxyOptions,
  config: ResolvedConfig,
) => {
  // Browsers may send Origin headers even with same-origin
  // requests. It is common for WebSocket servers to check the Origin
  // header, so if rewriteWsOrigin is true we change the Origin to match
  // the target URL.
  if (options.rewriteWsOrigin) {
    const { target } = options

    if (proxyReq.headersSent) {
      config.logger.warn(
        colors.yellow(
          `Unable to rewrite Origin header as headers are already sent.`,
        ),
      )
      return
    }

    if (proxyReq.getHeader('origin') && target) {
      const changedOrigin =
        typeof target === 'object'
          ? `${target.protocol}//${target.host}`
          : target

      proxyReq.setHeader('origin', changedOrigin)
    }
  }
}

export function proxyMiddleware(
  httpServer: HttpServer | null,
  options: NonNullable<CommonServerOptions['proxy']>,
  config: ResolvedConfig,
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

    proxy.on('error', (err, _req, originalRes) => {
      // When it is ws proxy, res is net.Socket
      // originalRes can be falsy if the proxy itself errored
      const res = originalRes as http.ServerResponse | net.Socket | undefined
      if (!res) {
        config.logger.error(
          `${colors.red(`http proxy error: ${err.message}`)}\n${err.stack}`,
          {
            timestamp: true,
            error: err,
          },
        )
      } else if ('req' in res) {
        config.logger.error(
          `${colors.red(`http proxy error: ${originalRes.req.url}`)}\n${
            err.stack
          }`,
          {
            timestamp: true,
            error: err,
          },
        )
        if (!res.headersSent && !res.writableEnded) {
          res
            .writeHead(500, {
              'Content-Type': 'text/plain',
            })
            .end()
        }
      } else {
        config.logger.error(`${colors.red(`ws proxy error:`)}\n${err.stack}`, {
          timestamp: true,
          error: err,
        })
        res.end()
      }
    })

    proxy.on('proxyReqWs', (proxyReq, _req, socket, options) => {
      rewriteOriginHeader(proxyReq, options, config)

      socket.on('error', (err) => {
        config.logger.error(
          `${colors.red(`ws proxy socket error:`)}\n${err.stack}`,
          {
            timestamp: true,
            error: err,
          },
        )
      })
    })

    // https://github.com/http-party/node-http-proxy/issues/1520#issue-877626125
    // https://github.com/chimurai/http-proxy-middleware/blob/cd58f962aec22c925b7df5140502978da8f87d5f/src/plugins/default/debug-proxy-errors-plugin.ts#L25-L37
    proxy.on('proxyRes', (proxyRes, _req, res) => {
      res.on('close', () => {
        if (!res.writableEnded) {
          debug?.('destroying proxyRes in proxyRes close event')
          proxyRes.destroy()
        }
      })
    })

    // clone before saving because http-proxy mutates the options
    proxies[context] = [proxy, { ...opts }]
  })

  if (httpServer) {
    httpServer.on('upgrade', async (req, socket, head) => {
      const url = req.url!
      for (const context in proxies) {
        if (doesProxyContextMatchUrl(context, url)) {
          const [proxy, opts] = proxies[context]
          if (
            opts.ws ||
            opts.target?.toString().startsWith('ws:') ||
            opts.target?.toString().startsWith('wss:')
          ) {
            if (opts.bypass) {
              try {
                const bypassResult = await opts.bypass(req, undefined, opts)
                if (typeof bypassResult === 'string') {
                  debug?.(`bypass: ${req.url} -> ${bypassResult}`)
                  req.url = bypassResult
                  return
                }
                if (bypassResult === false) {
                  debug?.(`bypass: ${req.url} -> 404`)
                  socket.end('HTTP/1.1 404 Not Found\r\n\r\n', '')
                  return
                }
              } catch (err) {
                config.logger.error(
                  `${colors.red(`ws proxy bypass error:`)}\n${err.stack}`,
                  {
                    timestamp: true,
                    error: err,
                  },
                )
                return
              }
            }

            if (opts.rewrite) {
              req.url = opts.rewrite(url)
            }
            debug?.(`${req.url} -> ws ${opts.target}`)
            proxy.ws(req, socket, head)
            return
          }
        }
      }
    })
  }

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return async function viteProxyMiddleware(req, res, next) {
    const url = req.url!
    for (const context in proxies) {
      if (doesProxyContextMatchUrl(context, url)) {
        const [proxy, opts] = proxies[context]
        const options: HttpProxy.ServerOptions = {}

        if (opts.bypass) {
          try {
            const bypassResult = await opts.bypass(req, res, opts)
            if (typeof bypassResult === 'string') {
              debug?.(`bypass: ${req.url} -> ${bypassResult}`)
              req.url = bypassResult
              if (res.writableEnded) {
                return
              }
              return next()
            }
            if (bypassResult === false) {
              debug?.(`bypass: ${req.url} -> 404`)
              res.statusCode = 404
              return res.end()
            }
          } catch (e) {
            debug?.(`bypass: ${req.url} -> ${e}`)
            return next(e)
          }
        }

        debug?.(`${req.url} -> ${opts.target || opts.forward}`)
        if (opts.rewrite) {
          req.url = opts.rewrite(req.url!)
        }
        proxy.web(req, res, options)
        return
      }
    }
    next()
  }
}

function doesProxyContextMatchUrl(context: string, url: string): boolean {
  return (
    (context[0] === '^' && new RegExp(context).test(url)) ||
    url.startsWith(context)
  )
}
