import { ServerPlugin } from '.'
import { URL } from 'url'
import { IKoaProxiesOptions } from 'koa-proxies'
import type { ServerOptions as HttpProxyServerOptions } from 'http-proxy'

export type ProxiesOptions = IKoaProxiesOptions & HttpProxyServerOptions

export const proxyPlugin: ServerPlugin = ({ app, config, server }) => {
  if (!config.proxy) {
    return
  }

  const debug = require('debug')('vite:proxy')
  const proxy = require('koa-proxies')
  const options = config.proxy
  Object.keys(options).forEach((path) => {
    let opts = options[path]
    if (typeof opts === 'string') {
      opts = { target: opts } as ProxiesOptions
    }
    opts.logs = (ctx, target) => {
      debug(
        `${ctx.req.method} ${(ctx.req as any).oldPath} proxy to -> ${new URL(
          ctx.req.url!,
          target
        )}`
      )
    }
    app.use(proxy(path, opts))
  })

  server.on('upgrade', (req, socket, head) => {
    if (req.headers['sec-websocket-protocol'] !== 'vite-hmr') {
      for (const path in options) {
        const opts = options[path]
        if (typeof opts === 'object' && opts.ws) {
          proxy.proxy.ws(req, socket, head, opts)
        }
      }
    }
  })
}
