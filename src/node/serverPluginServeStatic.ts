import { Plugin } from './server'

const debug = require('debug')('vite:history')

export const serveStaticPlugin: Plugin = ({ root, app }) => {
  // short circuit requests that have already been explicitly handled
  app.use((ctx, next) => {
    if (ctx.body || ctx.status !== 404) {
      return
    }
    return next()
  })

  // history API fallback
  app.use((ctx, next) => {
    const cleanUrl = ctx.url.split('?')[0].split('#')[0]
    if (ctx.method !== 'GET') {
      debug(`not redirecting ${ctx.url} (not GET)`)
      return next()
    }

    if (cleanUrl.includes('.')) {
      debug(`not redirecting ${ctx.url} (relative url)`)
      return next()
    }

    if (!ctx.headers || typeof ctx.headers.accept !== 'string') {
      debug(`not redirecting ${ctx.url} (no headers.accept)`)
      return next()
    }

    if (ctx.headers.accept.includes('application/json')) {
      debug(`not redirecting ${ctx.url} (json)`)
      return next()
    }

    if (
      !(
        ctx.headers.accept.includes('text/html') ||
        ctx.headers.accept.includes('*/*')
      )
    ) {
      debug(`not redirecting ${ctx.url} (not accepting html)`)
      return next()
    }

    debug(`redirecting ${ctx.url} to /index.html`)
    ctx.url = '/index.html'
    return next()
  })

  app.use(require('koa-conditional-get')())
  app.use(require('koa-etag')())
  app.use(require('koa-static')(root))
}
