import fs from 'fs'
import path from 'path'
import { Connect } from 'types/connect'
import { Plugin } from '../../plugin'
import {
  scriptRE,
  applyHtmlTransforms,
  IndexHtmlTransformHook,
  resolveHtmlTransforms,
  htmlCommentRE
} from '../../plugins/html'
import { ViteDevServer } from '../..'
import { send } from '../send'
import { CLIENT_PUBLIC_PATH } from '../../constants'

const devHtmlHook: IndexHtmlTransformHook = (html, { path }) => {
  let index = -1
  html = html
    .replace(htmlCommentRE, '')
    .replace(scriptRE, (_match, _openTag, script) => {
      index++
      if (script) {
        // convert inline <script type="module"> into imported modules
        return `<script type="module" src="${path}?html-proxy&index=${index}.js"></script>`
      }
      return _match
    })

  return {
    html,
    tags: [
      {
        tag: 'script',
        attrs: { type: 'module', src: CLIENT_PUBLIC_PATH },
        injectTo: 'head-prepend'
      }
    ]
  }
}

export function indexHtmlMiddleware(
  server: ViteDevServer,
  plugins: readonly Plugin[]
): Connect.NextHandleFunction {
  const [preHooks, postHooks] = resolveHtmlTransforms(plugins)

  return async (req, res, next) => {
    // spa-fallback always redirects to /index.html
    if (
      req.url?.endsWith('.html') &&
      req.headers['sec-fetch-dest'] !== 'script'
    ) {
      const filename = path.join(server.config.root, req.url!.slice(1))
      if (fs.existsSync(filename)) {
        try {
          let html = fs.readFileSync(filename, 'utf-8')
          // apply transforms
          html = await applyHtmlTransforms(
            html,
            req.url!,
            filename,
            [...preHooks, devHtmlHook, ...postHooks],
            server
          )
          return send(req, res, html, 'html')
        } catch (e) {
          return next(e)
        }
      }
    }
    next()
  }
}
