import { ServerPlugin } from '.'
import url, { URL } from 'url'
import { IncomingMessage } from 'http'
import httpProxy from 'http-proxy'

function shouldProxy(pathPrefix: string, req: IncomingMessage) {
  const reqPath = decodeURI(url.parse(req.url!).pathname!)
  return reqPath.startsWith(pathPrefix)
}

export const proxyPlugin: ServerPlugin = ({ app, config, server }) => {
  if (!config.proxy) {
    return
  }

  const debug = require('debug')('vite:proxy')
  const proxy = require('koa-proxies')
  const options = config.proxy
  let hasWebsocket = false
  Object.keys(options).forEach((path) => {
    let opts = options[path]
    if (typeof opts === 'string') {
      opts = { target: opts }
    }

    if (opts.target.startsWith('ws')) {
      hasWebsocket = true
    } else {
      const proxyServer = proxy(path, opts)
      opts.logs = (ctx, target) => {
        debug(
          `${ctx.req.method} ${(ctx.req as any).oldPath} proxy to -> ${new URL(
            ctx.req.url!,
            target
          )}`
        )
      }
      app.use(proxyServer)
    }
  })

  const proxies: Record<string, httpProxy> = {}

  if (hasWebsocket) {
    server.on('upgrade', (req, socket, head) => {
      Object.keys(options).forEach((path) => {
        let opts = options[path]
        if (typeof opts === 'string') {
          opts = { target: opts }
        }
        if (shouldProxy(path, req)) {
          debug(`UPGRADE ${path} proxy to -> ${opts.target}`)
          if (!proxies[path]) {
            proxies[path] = httpProxy.createProxyServer({ ws: true, ...opts })
          }
          const wsProxy = proxies[path]
          wsProxy.on('error', () => {
            socket.end()
          })
          wsProxy.ws(req, socket, head)
        }
      })
    })
  }
}
