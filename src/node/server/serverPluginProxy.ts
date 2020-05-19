import { ServerPlugin } from '.'
import { URL } from 'url'

export const proxyPlugin: ServerPlugin = ({ app, config }) => {
  if (!config.proxy) {
    return
  }

  const debug = require('debug')('vite:proxy')
  const proxy = require('koa-proxies')
  const options = config.proxy
  Object.keys(options).forEach((path) => {
    let opts = options[path]
    if (typeof opts === 'string') {
      opts = { target: opts }
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
}
