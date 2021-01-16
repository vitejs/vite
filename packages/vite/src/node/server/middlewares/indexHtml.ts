import fs from 'fs'
import path from 'path'
import MagicString from 'magic-string'
import {
  AttributeNode,
  NodeTransform,
  NodeTypes,
  parse,
  transform
} from '@vue/compiler-dom'
import { Connect } from 'types/connect'
import { Plugin } from '../../plugin'
import {
  scriptModuleRE,
  applyHtmlTransforms,
  IndexHtmlTransformHook,
  resolveHtmlTransforms,
  htmlCommentRE
} from '../../plugins/html'
import { ViteDevServer } from '../..'
import { send } from '../send'
import { CLIENT_PUBLIC_PATH, FS_PREFIX } from '../../constants'
import { cleanUrl } from '../../utils'
import { assetAttrsConfig, formatParseError } from '../../plugins/html'

const devHtmlHook: IndexHtmlTransformHook = async (
  html,
  { path: filePath, server }
) => {
  let index = -1
  const comments: string[] = []
  const config = server?.config!
  const base = config.base || '/'

  html = html
    .replace(htmlCommentRE, (m) => {
      comments.push(m)
      return `<!--VITE_COMMENT_${comments.length - 1}-->`
    })
    .replace(scriptModuleRE, (_match, _openTag, script) => {
      index++
      if (script) {
        // convert inline <script type="module"> into imported modules
        return `<script type="module" src="${filePath}?html-proxy&index=${index}.js"></script>`
      }
      return _match
    })
    .replace(/<!--VITE_COMMENT_(\d+)-->/g, (_, i) => comments[i])
    // @vue/compiler-core doesn't like lowercase doctypes
    .replace(/<!doctype\s/i, '<!DOCTYPE ')

  let ast
  try {
    ast = parse(html, { comments: true })
  } catch (e) {
    const parseError = {
      loc: filePath,
      frame: '',
      ...formatParseError(e, filePath, html)
    }
    throw new Error(
      `Unable to parse ${JSON.stringify(parseError.loc)}\n${parseError.frame}`
    )
  }

  const s = new MagicString(html)
  const viteDevIndexHtmlTransform: NodeTransform = (node) => {
    if (node.type !== NodeTypes.ELEMENT) {
      return
    }

    // script tags
    if (node.tag === 'script') {
      const srcAttr = node.props.find(
        (p) => p.type === NodeTypes.ATTRIBUTE && p.name === 'src'
      ) as AttributeNode

      const url = srcAttr?.value?.content || ''
      if (url.startsWith('/')) {
        // prefix with base
        s.overwrite(
          srcAttr.value!.loc.start.offset,
          srcAttr.value!.loc.end.offset,
          config.base + url.slice(1)
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
              config.base + url.slice(1)
            )
          }
        }
      }
    }
  }

  try {
    transform(ast, {
      nodeTransforms: [viteDevIndexHtmlTransform]
    })
  } catch (e) {
    const parseError = {
      loc: filePath,
      frame: '',
      ...formatParseError(e, filePath, html)
    }
    throw new Error(
      `Unable to parse ${JSON.stringify(parseError.loc)}\n${parseError.frame}`
    )
  }

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
