import fs from 'fs'
import getEtag from 'etag'
import path from 'path'
import { NextHandleFunction } from 'connect'
import { Plugin } from '../../config'
import {
  applyHtmlTransforms,
  IndexHtmlTransformHook,
  resolveHtmlTransforms
} from '../../plugins/html'
import { ServerContext } from '../..'
import { send } from '../send'

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

  // cache the transform in the closure
  let html = ''
  let etag = ''
  let lastModified = 0

  return async (req, res, next) => {
    // spa-fallback always redirects to /index.html
    if (
      req.url === '/index.html' &&
      req.headers['sec-fetch-dest'] !== 'script' &&
      fs.existsSync(filename)
    ) {
      const stats = fs.statSync(filename)
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
          etag = getEtag(html, { weak: true })
        } catch (e) {
          return next(e)
        }
      }

      return send(req, res, html, 'text/html', etag)
    }

    next()
  }
}
