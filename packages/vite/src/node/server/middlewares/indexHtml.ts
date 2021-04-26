import fs from 'fs'
import path from 'path'
import MagicString from 'magic-string'
import { NodeTypes } from '@vue/compiler-dom'
import { Connect } from 'types/connect'
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
import { cleanUrl, fsPathFromId } from '../../utils'
import { assetAttrsConfig } from '../../plugins/html'

export function createDevHtmlTransformFn(
  server: ViteDevServer
): (url: string, html: string) => Promise<string> {
  const [preHooks, postHooks] = resolveHtmlTransforms(server.config.plugins)

  return (url: string, html: string): Promise<string> => {
    return applyHtmlTransforms(
      html,
      url,
      getHtmlFilename(url, server),
      [...preHooks, devHtmlHook, ...postHooks],
      server
    )
  }
}

function getHtmlFilename(url: string, server: ViteDevServer) {
  if (url.startsWith(FS_PREFIX)) {
    return fsPathFromId(url)
  } else {
    return path.join(server.config.root, url.slice(1))
  }
}

const startsWithSingleSlashRE = /^\/(?!\/)/
const devHtmlHook: IndexHtmlTransformHook = async (
  html,
  { path: htmlPath, server }
) => {
  // TODO: solve this design issue
  // Optional chain expressions can return undefined by design
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
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
        if (startsWithSingleSlashRE.test(url)) {
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
          if (startsWithSingleSlashRE.test(url)) {
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
  server: ViteDevServer
): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url && cleanUrl(req.url)
    // spa-fallback always redirects to /index.html
    if (url?.endsWith('.html') && req.headers['sec-fetch-dest'] !== 'script') {
      const filename = getHtmlFilename(url, server)
      if (fs.existsSync(filename)) {
        try {
          let html = fs.readFileSync(filename, 'utf-8')
          html = await server.transformIndexHtml(url, html)
          return send(req, res, html, 'html')
        } catch (e) {
          return next(e)
        }
      }
    }
    next()
  }
}
