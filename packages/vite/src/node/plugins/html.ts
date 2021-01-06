import fs from 'fs'
import path from 'path'
import { Plugin } from '../plugin'
import { ViteDevServer } from '../server'
import { OutputBundle, OutputChunk } from 'rollup'
import { cleanUrl, isExternalUrl, isDataUrl, generateCodeFrame } from '../utils'
import { ResolvedConfig } from '../config'
import slash from 'slash'
import {
  AttributeNode,
  NodeTransform,
  NodeTypes,
  parse,
  transform
} from '@vue/compiler-dom'
import MagicString from 'magic-string'
import { checkPublicFile, assetUrlRE, urlToBuiltUrl } from './asset'
import { isCSSRequest, chunkToEmittedCssFileMap } from './css'
import { polyfillId } from './dynamicImportPolyfill'

const htmlProxyRE = /\?html-proxy&index=(\d+)\.js$/
export const isHTMLProxy = (id: string) => htmlProxyRE.test(id)
export const htmlCommentRE = /<!--[\s\S]*?-->/g
export const scriptRE = /(<script\b[^>]*type\s*=\s*(?:"module"|'module')[^>]*>)([\s\S]*?)<\/script>/gm

export function htmlPlugin(): Plugin {
  return {
    name: 'vite:html',

    resolveId(id) {
      if (htmlProxyRE.test(id)) {
        return id
      }
    },

    load(id) {
      const proxyMatch = id.match(htmlProxyRE)
      if (proxyMatch) {
        const index = Number(proxyMatch[1])
        const file = cleanUrl(id)
        const html = fs.readFileSync(file, 'utf-8').replace(htmlCommentRE, '')
        let match
        scriptRE.lastIndex = 0
        for (let i = 0; i <= index; i++) {
          match = scriptRE.exec(html)
        }
        if (match) {
          return match[2]
        } else {
          throw new Error(`No matching html proxy module found from ${id}`)
        }
      }
    }
  }
}

// this extends the config in @vue/compiler-sfc with <link href>
const assetAttrsConfig: Record<string, string[]> = {
  link: ['href'],
  video: ['src', 'poster'],
  source: ['src'],
  img: ['src'],
  image: ['xlink:href', 'href'],
  use: ['xlink:href', 'href']
}

/**
 * Compiles index.html into an entry js module
 */
export function buildHtmlPlugin(config: ResolvedConfig): Plugin {
  const [preHooks, postHooks] = resolveHtmlTransforms(config.plugins)
  const processedHtml = new Map<string, string>()
  const isExcludedUrl = (url: string) =>
    isExternalUrl(url) || isDataUrl(url) || checkPublicFile(url, config.root)

  return {
    name: 'vite:build-html',

    async transform(html, id) {
      if (id.endsWith('.html')) {
        const publicPath = `/${slash(path.relative(config.root, id))}`
        // pre-transform
        html = await applyHtmlTransforms(html, publicPath, id, preHooks)

        function formatError(e: any): Error {
          // normalize the error to rollup format
          if (e.loc) {
            e.frame = generateCodeFrame(html, e.loc.start.offset)
            e.loc = {
              file: id,
              line: e.loc.start.line,
              column: e.loc.start.column
            }
          }
          return e
        }

        // @vue/compiler-core doesn't like lowercase doctypes
        html = html.replace(/<!doctype\s/i, '<!DOCTYPE ')
        let ast
        try {
          ast = parse(html)
        } catch (e) {
          this.error(formatError(e))
        }

        let js = ''
        const s = new MagicString(html)
        const assetUrls: AttributeNode[] = []
        let inlineModuleIndex = -1
        const viteHtmlTransform: NodeTransform = (node) => {
          if (node.type !== NodeTypes.ELEMENT) {
            return
          }

          let shouldRemove = false

          // script tags
          if (node.tag === 'script') {
            const srcAttr = node.props.find(
              (p) => p.type === NodeTypes.ATTRIBUTE && p.name === 'src'
            ) as AttributeNode
            const typeAttr = node.props.find(
              (p) => p.type === NodeTypes.ATTRIBUTE && p.name === 'type'
            ) as AttributeNode
            const isJsModule =
              typeAttr && typeAttr.value && typeAttr.value.content === 'module'

            const url = srcAttr && srcAttr.value && srcAttr.value.content
            if (url && checkPublicFile(url, config.root)) {
              // referencing public dir url, prefix with base
              s.overwrite(
                srcAttr.value!.loc.start.offset,
                srcAttr.value!.loc.end.offset,
                config.build.base + url.slice(1)
              )
            }

            if (isJsModule) {
              inlineModuleIndex++
              if (url && !isExcludedUrl(url)) {
                // <script type="module" src="..."/>
                // add it as an import
                js += `\nimport ${JSON.stringify(url)}`
                shouldRemove = true
              } else if (node.children.length) {
                // <script type="module">...</script>
                js += `\nimport "${id}?html-proxy&index=${inlineModuleIndex}.js"`
                shouldRemove = true
              }
            }
          }

          // For asset references in index.html, also generate an import
          // statement for each - this will be handled by the asset plugin
          const assetAttrs = assetAttrsConfig[node.tag]
          if (assetAttrs) {
            for (const p of node.props) {
              if (
                p.type === NodeTypes.ATTRIBUTE &&
                p.value &&
                assetAttrs.includes(p.name)
              ) {
                const url = p.value.content
                if (!isExcludedUrl(url)) {
                  if (node.tag === 'link' && isCSSRequest(url)) {
                    // CSS references, convert to import
                    js += `\nimport ${JSON.stringify(url)}`
                    shouldRemove = true
                  } else {
                    assetUrls.push(p)
                  }
                } else if (checkPublicFile(url, config.root)) {
                  s.overwrite(
                    p.value.loc.start.offset,
                    p.value.loc.end.offset,
                    config.build.base + url.slice(1)
                  )
                }
              }
            }
          }

          if (shouldRemove) {
            // remove the script tag from the html. we are going to inject new
            // ones in the end.
            s.remove(node.loc.start.offset, node.loc.end.offset)
          }
        }

        try {
          transform(ast, {
            nodeTransforms: [viteHtmlTransform]
          })
        } catch (e) {
          this.error(formatError(e))
        }

        // for each encountered asset url, rewrite original html so that it
        // references the post-build location.
        for (const attr of assetUrls) {
          const value = attr.value!
          const url = await urlToBuiltUrl(value.content, id, config, this)
          s.overwrite(
            value.loc.start.offset,
            value.loc.end.offset,
            JSON.stringify(url)
          )
        }

        processedHtml.set(id, s.toString())

        // inject dynamic import polyfill
        if (config.build.polyfillDynamicImport) {
          js = `import "${polyfillId}";\n${js}`
        }

        return js
      }
    },

    async generateBundle(_, bundle) {
      const getPreloadLinksForChunk = (
        chunk: OutputChunk
      ): HtmlTagDescriptor[] => {
        const tags: HtmlTagDescriptor[] = chunk.imports.map((file) => ({
          tag: 'link',
          attrs: {
            rel: 'modulepreload',
            href: toPublicPath(file, config)
          }
        }))
        chunk.imports.forEach((file) => {
          tags.push(...getPreloadLinksForChunk(bundle[file] as OutputChunk))
        })
        return tags
      }

      const getCssTagsForChunk = (chunk: OutputChunk): HtmlTagDescriptor[] => {
        const tags: HtmlTagDescriptor[] = []
        const cssFileHandle = chunkToEmittedCssFileMap.get(chunk)
        if (cssFileHandle) {
          const file = this.getFileName(cssFileHandle)
          tags.push({
            tag: 'link',
            attrs: {
              rel: 'stylesheet',
              href: toPublicPath(file, config)
            }
          })
        }
        chunk.imports.forEach((file) => {
          tags.push(...getCssTagsForChunk(bundle[file] as OutputChunk))
        })
        return tags
      }

      for (const [id, html] of processedHtml) {
        // resolve asset url references
        let result = html.replace(assetUrlRE, (_, fileId, postfix = '') => {
          return config.build.base + this.getFileName(fileId) + postfix
        })

        // find corresponding entry chunk
        const chunk = Object.values(bundle).find(
          (chunk) =>
            chunk.type === 'chunk' &&
            chunk.isEntry &&
            chunk.facadeModuleId === id
        ) as OutputChunk | undefined

        // inject chunk asset links
        if (chunk) {
          const assetTags = [
            // js entry chunk for this page
            {
              tag: 'script',
              attrs: {
                type: 'module',
                src: toPublicPath(chunk.fileName, config)
              }
            },
            // preload for imports
            ...getPreloadLinksForChunk(chunk),
            ...getCssTagsForChunk(chunk)
          ]

          result = injectToHead(result, assetTags)
        }

        const shortEmitName = path.posix.relative(config.root, id)
        result = await applyHtmlTransforms(
          result,
          '/' + shortEmitName,
          id,
          postHooks,
          undefined,
          bundle,
          chunk
        )

        this.emitFile({
          type: 'asset',
          fileName: shortEmitName,
          source: result
        })
      }
    }
  }
}

export interface HtmlTagDescriptor {
  tag: string
  attrs?: Record<string, string | boolean>
  children?: string | HtmlTagDescriptor[]
  /**
   * default: 'head-prepend'
   */
  injectTo?: 'head' | 'body' | 'head-prepend'
}

export type IndexHtmlTransformResult =
  | string
  | HtmlTagDescriptor[]
  | {
      html: string
      tags: HtmlTagDescriptor[]
    }

export interface IndexHtmlTransformContext {
  /**
   * public path when served
   */
  path: string
  /**
   * filename on disk
   */
  filename: string
  server?: ViteDevServer
  bundle?: OutputBundle
  chunk?: OutputChunk
}

export type IndexHtmlTransformHook = (
  html: string,
  ctx: IndexHtmlTransformContext
) => IndexHtmlTransformResult | void | Promise<IndexHtmlTransformResult | void>

export type IndexHtmlTransform =
  | IndexHtmlTransformHook
  | {
      enforce?: 'pre' | 'post'
      transform: IndexHtmlTransformHook
    }

export function resolveHtmlTransforms(plugins: readonly Plugin[]) {
  const preHooks: IndexHtmlTransformHook[] = []
  const postHooks: IndexHtmlTransformHook[] = []

  for (const plugin of plugins) {
    const hook = plugin.transformIndexHtml
    if (hook) {
      if (typeof hook === 'function') {
        postHooks.push(hook)
      } else if (hook.enforce === 'pre') {
        preHooks.push(hook.transform)
      } else {
        postHooks.push(hook.transform)
      }
    }
  }

  return [preHooks, postHooks]
}

export async function applyHtmlTransforms(
  html: string,
  path: string,
  filename: string,
  hooks: IndexHtmlTransformHook[],
  server?: ViteDevServer,
  bundle?: OutputBundle,
  chunk?: OutputChunk
): Promise<string> {
  const headTags: HtmlTagDescriptor[] = []
  const headPrependTags: HtmlTagDescriptor[] = []
  const bodyTags: HtmlTagDescriptor[] = []

  const ctx: IndexHtmlTransformContext = {
    path,
    filename,
    server,
    bundle,
    chunk
  }

  for (const hook of hooks) {
    const res = await hook(html, ctx)
    if (!res) {
      continue
    } else if (typeof res === 'string') {
      html = res
    } else {
      let tags
      if (Array.isArray(res)) {
        tags = res
      } else {
        html = res.html || html
        tags = res.tags
      }
      for (const tag of tags) {
        if (tag.injectTo === 'body') {
          bodyTags.push(tag)
        } else if (tag.injectTo === 'head') {
          headTags.push(tag)
        } else {
          headPrependTags.push(tag)
        }
      }
    }
  }

  // inject tags
  if (headPrependTags.length) {
    html = injectToHead(html, headPrependTags, true)
  }
  if (headTags.length) {
    html = injectToHead(html, headTags)
  }
  if (bodyTags.length) {
    html = injectToBody(html, bodyTags)
  }

  return html
}

function toPublicPath(filename: string, config: ResolvedConfig) {
  return isExternalUrl(filename) ? filename : config.build.base + filename
}

const headInjectRE = /<\/head>/
const headPrependInjectRE = [/<head>/, /<!doctype html>/i]
function injectToHead(
  html: string,
  tags: HtmlTagDescriptor[],
  prepend = false
) {
  const tagsHtml = serializeTags(tags)
  if (prepend) {
    // inject after head or doctype
    for (const re of headPrependInjectRE) {
      if (re.test(html)) {
        return html.replace(re, `$&\n${tagsHtml}`)
      }
    }
  } else {
    // inject before head close
    if (headInjectRE.test(html)) {
      return html.replace(headInjectRE, `${tagsHtml}\n$&`)
    }
  }
  // if no <head> tag is present, just prepend
  return tagsHtml + `\n` + html
}

const bodyInjectRE = /<\/body>/
function injectToBody(html: string, tags: HtmlTagDescriptor[]) {
  const tagsHtml = `\n` + serializeTags(tags)
  if (bodyInjectRE.test(html)) {
    return html.replace(bodyInjectRE, `${tagsHtml}\n$&`)
  }
  // if no body, append
  return html + `\n` + tagsHtml
}

const unaryTags = new Set(['link', 'meta', 'base'])

function serializeTag({ tag, attrs, children }: HtmlTagDescriptor): string {
  if (unaryTags.has(tag)) {
    return `<${tag}${serializeAttrs(attrs)}>`
  } else {
    return `<${tag}${serializeAttrs(attrs)}>${serializeTags(children)}</${tag}>`
  }
}

function serializeTags(tags: HtmlTagDescriptor['children']): string {
  if (typeof tags === 'string') {
    return tags
  } else if (tags) {
    return tags.map(serializeTag).join(`\n  `)
  }
  return ''
}

function serializeAttrs(attrs: HtmlTagDescriptor['attrs']): string {
  let res = ''
  for (const key in attrs) {
    if (typeof attrs[key] === 'boolean' && attrs[key]) {
      res += ` ${key}`
    } else {
      res += ` ${key}=${JSON.stringify(attrs[key])}`
    }
  }
  return res
}
