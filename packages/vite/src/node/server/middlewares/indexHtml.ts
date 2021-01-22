import fs from 'fs'
import path from 'path'
import MagicString from 'magic-string'
import { NodeTypes } from '@vue/compiler-dom'
import { Connect } from 'types/connect'
import { Plugin } from '../../plugin'
import {
  applyHtmlTransforms,
  getScriptInfo,
  IndexHtmlTransformHook,
  resolveHtmlTransforms,
  traverseHtml
} from '../../plugins/html'
import { ViteDevServer } from '../..'
import { send } from '../send'
import { CLIENT_PUBLIC_PATH, FS_PREFIX } from '../../constants'
import { cleanUrl } from '../../utils'
import { assetAttrsConfig } from '../../plugins/html'

const devHtmlHook: IndexHtmlTransformHook = async (
  html,
  { path: htmlPath, server }
) => {
  const config = server?.config!
  const base = config.base || '/'

  const s = new MagicString(html)
  let scriptModuleIndex = -1

  await traverseHtml(html, htmlPath, (node) => {
    if (node.type !== NodeTypes.ELEMENT) {
      return
    }

    // script tags
    if (node.tag === 'script') {
      const { src, isModule } = getScriptInfo(node)
      if (isModule) {
        scriptModuleIndex++
      }

      if (src) {
        const url = src.value?.content || ''
        if (url.startsWith('/')) {
          // prefix with base
          s.overwrite(
            src.value!.loc.start.offset,
            src.value!.loc.end.offset,
            `"${config.base + url.slice(1)}"`
          )
        }
      } else if (isModule) {
        // inline js module. convert to src="proxy"
        s.overwrite(
          node.loc.start.offset,
          node.loc.end.offset,
          `<script type="module" src="${
            config.base + htmlPath.slice(1)
          }?html-proxy&index=${scriptModuleIndex}.js"></script>`
        )
      }
    }

    // elements with [href/src] attrs
    const assetAttrs = assetAttrsConfig[node.tag]
    if (assetAttrs) {
      for (const p of node.props) {
        if (
          p.type === NodeTypes.ATTRIBUTE &&
          p.value &&
          assetAttrs.includes(p.name)
        ) {
          const url = p.value.content || ''
          if (url.startsWith('/')) {
            s.overwrite(
              p.value.loc.start.offset,
              p.value.loc.end.offset,
              `"${config.base + url.slice(1)}"`
            )
          }
        }
      }
    }
  })

  html = s.toString()

  return {
    html,
    tags: [
      {
        tag: 'script',
        attrs: {
          type: 'module',
          src: path.posix.join(base, CLIENT_PUBLIC_PATH)
        },
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
    const url = req.url && cleanUrl(req.url)
    // spa-fallback always redirects to /index.html
    if (url?.endsWith('.html') && req.headers['sec-fetch-dest'] !== 'script') {
      let filename
      if (url.startsWith(FS_PREFIX)) {
        filename = url.slice(FS_PREFIX.length)
      } else {
        filename = path.join(server.config.root, url.slice(1))
      }
      if (fs.existsSync(filename)) {
        try {
          let html = fs.readFileSync(filename, 'utf-8')
          // apply transforms
          html = await applyHtmlTransforms(
            html,
            url,
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
