import fs from 'fs'
import etag from 'etag'
import path from 'path'
import { NextHandleFunction } from 'connect'
import { Plugin } from '../../config'
import {
  applyHtmlTransforms,
  IndexHtmlTransformHook,
  resolveHtmlTransforms
} from '../../plugins/html'
import { ServerContext } from '../..'

const devHtmlHook: IndexHtmlTransformHook = (html) => {
  return html
  // return [{ tag: 'script', attrs: { type: 'module', src: '/vite/client' } }]
}

export function indexHtmlMiddleware(
  ctx: ServerContext,
  plugins: readonly Plugin[]
): NextHandleFunction {
  const [preHooks, postHooks] = resolveHtmlTransforms(plugins)
  const filename = path.join(ctx.config.root, 'index.html')

  let html = ''
  let lastModified = 0

  return async (req, res, next) => {
    // spa-fallback always redirects to /index.html
    if (
      req.url === '/index.html' &&
      req.headers['sec-fetch-dest'] !== 'script' &&
      fs.existsSync(filename)
    ) {
      const stats = fs.statSync(filename)
      res.setHeader('Content-Type', 'text/html')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Last-Midified', stats.mtime.toUTCString())

      if (stats.mtimeMs !== lastModified) {
        lastModified = stats.mtimeMs
        html = fs.readFileSync(filename, 'utf-8')
        try {
          // apply transforms
          html = await applyHtmlTransforms(
            html,
            [...preHooks, devHtmlHook, ...postHooks],
            ctx
          )
        } catch (e) {
          return next(e)
        }
      }

      const Etag = etag(html, { weak: true })
      res.setHeader('ETag', Etag)

      if (req.headers['if-none-match'] === Etag) {
        res.statusCode = 304
        return res.end()
      }

      res.statusCode = 200
      res.end(html)
    }

    next()
  }
}
