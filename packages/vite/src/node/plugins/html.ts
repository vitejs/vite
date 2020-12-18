import fs from 'fs'
import path from 'path'
import { Plugin } from '../plugin'
import { ViteDevServer } from '../server'
import { OutputBundle } from 'rollup'
import { cleanUrl, isExternalUrl, isDataUrl } from '../utils'
import { ResolvedConfig } from '../config'
import slash from 'slash'
import {
  AttributeNode,
  NodeTransform,
  NodeTypes,
  parse,
  TextNode,
  transform
} from '@vue/compiler-dom'
import MagicString from 'magic-string'

const htmlProxyRE = /\?html-proxy&index=(\d+)\.js$/
export const isHTMLProxy = (id: string) => htmlProxyRE.test(id)
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
        const html = fs.readFileSync(file, 'utf-8')
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

export function buildHtmlPlugin(config: ResolvedConfig): Plugin {
  const [preHooks, postHooks] = resolveHtmlTransforms(config.plugins)
  const processedHtml = new Map<string, string>()

  return {
    name: 'vite:build-html',

    async transform(html, id) {
      if (id.endsWith('.html')) {
        const publicPath = `/${slash(path.relative(config.root, id))}`
        // pre-transform
        html = await applyHtmlTransforms(html, publicPath, id, preHooks)
        // compile index.html into an entry js module

        // @vue/compiler-core doesn't like lowercase doctypes
        html = html.replace(/<!doctype\s/i, '<!DOCTYPE ')
        const ast = parse(html)

        let js = ''
        const s = new MagicString(html)
        const assetUrls: AttributeNode[] = []
        const viteHtmlTransform: NodeTransform = (node) => {
          if (node.type === NodeTypes.ELEMENT) {
            if (node.tag === 'script') {
              let shouldRemove = false

              const srcAttr = node.props.find(
                (p) => p.type === NodeTypes.ATTRIBUTE && p.name === 'src'
              ) as AttributeNode
              const typeAttr = node.props.find(
                (p) => p.type === NodeTypes.ATTRIBUTE && p.name === 'type'
              ) as AttributeNode
              const isJsModule =
                typeAttr &&
                typeAttr.value &&
                typeAttr.value.content === 'module'

              if (isJsModule) {
                if (srcAttr && srcAttr.value) {
                  if (!isExternalUrl(srcAttr.value.content)) {
                    // <script type="module" src="..."/>
                    // add it as an import
                    js += `\nimport ${JSON.stringify(srcAttr.value.content)}`
                    shouldRemove = true
                  }
                } else if (node.children.length) {
                  // <script type="module">...</script>
                  // add its content
                  // TODO: if there are multiple inline module scripts on the page,
                  // they should technically be turned into separate modules, but
                  // it's hard to imagine any reason for anyone to do that.
                  js +=
                    `\n` + (node.children[0] as TextNode).content.trim() + `\n`
                  shouldRemove = true
                }
              }

              if (shouldRemove) {
                // remove the script tag from the html. we are going to inject new
                // ones in the end.
                s.remove(node.loc.start.offset, node.loc.end.offset)
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
                  assetAttrs.includes(p.name) &&
                  !isExternalUrl(p.value.content) &&
                  !isDataUrl(p.value.content)
                ) {
                  assetUrls.push(p)
                }
              }
            }
          }
        }

        transform(ast, {
          nodeTransforms: [viteHtmlTransform]
        })

        // TODO for each encountered asset url, rewrite original html so that it
        // references the post-build location.
        // for (const attr of assetUrls) {
        // const value = attr.value!
        // const { fileName, content, url } = await resolveAsset(
        //   resolver.requestToFile(value.content),
        //   root,
        //   publicBasePath,
        //   assetsDir,
        //   cleanUrl(value.content).endsWith('.css') ? 0 : inlineLimit
        // )
        // s.overwrite(value.loc.start.offset, value.loc.end.offset, `"${url}"`)
        // if (fileName && content) {
        //   assets.set(fileName, content)
        // }
        // }

        // TODO should store the imported entries for each page
        // and inject corresponding assets
        processedHtml.set(id, s.toString())
        return js
      }
    },

    async generateBundle(_, bundle) {
      for (const [file, html] of processedHtml) {
        let result = html
        for (const chunkName in bundle) {
          const chunk = bundle[chunkName]
          if (chunk.type === 'chunk') {
            if (chunk.isEntry) {
              // js entry chunk
              result = injectScript(result, chunk.fileName, config)
            } else {
              // TODO anaylyze if this should preload or not
              result = injectPreload(result, chunk.fileName, config)
            }
          } else {
            // imported css chunks
            if (
              chunk.fileName.endsWith('.css') &&
              chunk.source
              // && !assets.has(chunk.fileName)
            ) {
              result = injectCSS(result, chunk.fileName, config)
            }
          }
        }

        result = await applyHtmlTransforms(
          result,
          file,
          file,
          postHooks,
          undefined,
          bundle
        )

        this.emitFile({
          type: 'asset',
          fileName: path.relative(config.root, file),
          source: result
        })
      }
    }
  }
}

export interface HtmlTagDescriptor {
  tag: string
  attrs?: Record<string, string>
  children?: string | HtmlTagDescriptor[]
  injectTo?: 'head' | 'body'
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
}

export type IndexHtmlTransformHook = (
  html: string,
  ctx: IndexHtmlTransformContext
) => IndexHtmlTransformResult | Promise<IndexHtmlTransformResult>

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
  bundle?: OutputBundle
): Promise<string> {
  const headTags: HtmlTagDescriptor[] = []
  const bodyTags: HtmlTagDescriptor[] = []

  const ctx = {
    path,
    filename,
    server,
    bundle
  }

  for (const hook of hooks) {
    const res = await hook(html, ctx)
    if (typeof res === 'string') {
      html = res
    } else {
      let tags
      if (Array.isArray(res)) {
        tags = res
      } else {
        html = res.html
        tags = res.tags
      }
      for (const tag of tags) {
        if (tag.injectTo === 'body') {
          bodyTags.push(tag)
        } else {
          headTags.push(tag)
        }
      }
    }
  }

  // inject tags
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

function injectScript(html: string, filename: string, config: ResolvedConfig) {
  return injectToHead(html, [
    {
      tag: 'script',
      attrs: {
        type: 'module',
        src: toPublicPath(filename, config)
      }
    }
  ])
}

function injectCSS(html: string, filename: string, config: ResolvedConfig) {
  return injectToHead(html, [
    {
      tag: 'link',
      attrs: {
        rel: 'stylesheet',
        href: toPublicPath(filename, config)
      }
    }
  ])
}

function injectPreload(html: string, filename: string, config: ResolvedConfig) {
  return injectToHead(html, [
    {
      tag: 'link',
      attrs: {
        rel: 'modulepreload',
        href: toPublicPath(filename, config)
      }
    }
  ])
}

const headInjectRE = /<\/head>/
function injectToHead(html: string, tags: HtmlTagDescriptor[]) {
  const tagsHtml = serializeTags(tags) + `\n`
  // inject after head or doctype
  if (headInjectRE.test(html)) {
    return html.replace(headInjectRE, `${tagsHtml}$&`)
  }
  // if no <head> tag is present, just prepend
  return tagsHtml + html
}

const bodyInjectRE = /<\/body>/
function injectToBody(html: string, tags: HtmlTagDescriptor[]) {
  const tagsHtml = `\n` + serializeTags(tags)
  if (bodyInjectRE.test(html)) {
    return html.replace(bodyInjectRE, `${tagsHtml}$&`)
  }
  // if no body, append
  return html + tagsHtml
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
    res += ` ${key}=${JSON.stringify(attrs[key])}`
  }
  return res
}
