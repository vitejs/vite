import fs from 'fs'
import path from 'path'
import { ServerPlugin } from '.'
import { isStaticAsset } from '../utils'
import chalk from 'chalk'

const send = require('koa-send')
const debug = require('debug')('vite:history')

export const seenUrls = new Set()

export const serveStaticPlugin: ServerPlugin = ({
  root,
  app,
  resolver,
  config
}) => {
  app.use((ctx, next) => {
    // short circuit requests that have already been explicitly handled
    if (ctx.body || ctx.status !== 404) {
      return
    }
    return next()
  })

  if (!config.serviceWorker) {
    app.use(async (ctx, next) => {
      await next()
      // the first request to the server should never 304
      if (seenUrls.has(ctx.url) && ctx.fresh) {
        ctx.status = 304
      }
      seenUrls.add(ctx.url)
    })
  }
  app.use(require('koa-etag')())

  app.use((ctx, next) => {
    if (ctx.path.startsWith('/public/') && isStaticAsset(ctx.path)) {
      console.error(
        chalk.yellow(
          `[vite] files in the public directory are served at the root path.\n` +
            `  ${chalk.blue(ctx.path)} should be changed to ${chalk.blue(
              ctx.path.replace(/^\/public\//, '/')
            )}.`
        )
      )
    }
    const filePath = resolver.requestToFile(ctx.path)
    if (
      filePath !== ctx.path &&
      fs.existsSync(filePath) &&
      fs.statSync(filePath).isFile()
    ) {
      return send(ctx, filePath, { root: '/' })
    }
    return next()
  })
  app.use(require('koa-static')(root))
  app.use(require('koa-static')(path.join(root, 'public')))

  // history API fallback
  app.use(async (ctx, next) => {
    if (ctx.status !== 404) {
      return next()
    }

    if (ctx.method !== 'GET') {
      debug(`not redirecting ${ctx.url} (not GET)`)
      return next()
    }

    const accept = ctx.headers && ctx.headers.accept
    if (typeof accept !== 'string') {
      debug(`not redirecting ${ctx.url} (no headers.accept)`)
      return next()
    }

    if (accept.includes('application/json')) {
      debug(`not redirecting ${ctx.url} (json)`)
      return next()
    }

    if (!accept.includes('text/html')) {
      debug(`not redirecting ${ctx.url} (not accepting html)`)
      return next()
    }

    debug(`redirecting ${ctx.url} to /index.html`)
    try {
      await send(ctx, `index.html`, { root })
    } catch (e) {
      ctx.url = '/index.html'
      ctx.status = 404
      return next()
    }
  })
}
