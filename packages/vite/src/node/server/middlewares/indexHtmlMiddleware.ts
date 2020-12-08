import path from 'path'
import { NextHandleFunction } from 'connect'
import { Plugin } from '../../config'
import {
  applyHtmlTransforms,
  IndexHtmlTransformHook,
  resolveHtmlTransforms
} from '../../plugins/html'
import { ServerContext } from '../..'
import { sendWithTransform } from '../send'

const devHtmlHook: IndexHtmlTransformHook = (html) => {
  return [{ tag: 'script', attrs: { type: 'module', src: '/vite/client' } }]
}

export function indexHtmlMiddleware(
  ctx: ServerContext,
  plugins: readonly Plugin[]
): NextHandleFunction {
  const [preHooks, postHooks] = resolveHtmlTransforms(plugins)
  const filename = path.join(ctx.config.root, 'index.html')

  return (req, res, next) => {
    // spa-fallback always redirects to /index.html
    if (req.url === '/index.html') {
      sendWithTransform(filename, req, res, next, (html) => {
        return applyHtmlTransforms(
          html,
          [...preHooks, devHtmlHook, ...postHooks],
          ctx
        )
      })
    }
  }
}
