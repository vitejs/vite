import sirv from 'sirv'
import path from 'path'
import { ServerHook } from '../commands/serve'
import { ServerOptions as ProxyOptions } from 'http-proxy'

const debug = require('debug')('vite:server')

export const setupServer: ServerHook = ({
  root,
  app,
  server,
  watcher,
  config,
  container
}) => {
  debug(`serving ${root}`)

  const {
    server: { proxy, cors }
  } = config

  // proxy
  if (proxy) {
    const { createProxyMiddleware } = require('http-proxy-middleware')
    Object.keys(proxy).forEach((context) => {
      let opts = proxy[context]
      if (typeof opts === 'string') {
        opts = { target: opts } as ProxyOptions
      }
      app.use(createProxyMiddleware(context, opts))
    })
  }

  // cors
  if (cors) {
    app.use(require('cors')(typeof cors === 'boolean' ? {} : cors))
  }

  // serve static files
  app.use(sirv(root, { dev: true, single: true, etag: true }))
  app.use(sirv(path.join(root, 'public'), { dev: true, etag: true }))
}
