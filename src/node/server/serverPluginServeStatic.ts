import { statSync, ReadStream } from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { ServerPlugin } from '.'

const send = require('koa-send')
const debug = require('debug')('vite:history')

export const seenUrls = new Set()

const generateETag = (content: string, length: number) => {
  if (!length) return '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"'
  const hash = createHash('sha1').update(content, 'utf8').digest('hex')
  return `${length.toString(16)}-${hash}`
}

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

  // history API fallback
  app.use((ctx, next) => {
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

    if (!(accept.includes('text/html') || accept.includes('*/*'))) {
      debug(`not redirecting ${ctx.url} (not accepting html)`)
      return next()
    }

    const ext = path.extname(ctx.path)
    if (ext && !accept.includes('text/html')) {
      debug(`not redirecting ${ctx.url} (has file extension)`)
      return next()
    }

    debug(`redirecting ${ctx.url} to /index.html`)
    ctx.url = '/index.html'
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
  app.use(async (ctx, next) => {
    await next()

    let etag = null
    const { body, status, response } = ctx

    if (!body || response.get('etag')) {
      debug(`${ctx.url} response body is empty or an etag already exists`)
      return
    }

    /** status 2xx */
    if (Math.ceil(status / 100) !== 2) {
      debug(`${ctx.url} response status code is abnormal`)
      return
    }

    if (body instanceof ReadStream) {
      /** isStream */
      if (!body.path) return
      const { mtime, size } = statSync(body.path)
      debug(`${ctx.url} to /index.html`)
      etag = `${size.toString(16)}-${mtime.getTime().toString(16)}`
    } else if (Buffer.isBuffer(body)) {
      /** isBuffer */
      const target = body.toString()
      const length = Buffer.byteLength(body, 'utf8')
      etag = generateETag(target, length)
    } else {
      /** other */
      const target = JSON.stringify(body)
      const length = target.length
      etag = generateETag(target, length)
    }

    if (etag) response.etag = etag
  })

  app.use((ctx, next) => {
    const redirect = resolver.requestToFile(ctx.path)
    if (!redirect.startsWith(root)) {
      // resolver resolved to a file that is outside of project root,
      // manually send here
      return send(ctx, redirect, { root: '/' })
    }
    return next()
  })

  app.use(require('koa-static')(root))
}
