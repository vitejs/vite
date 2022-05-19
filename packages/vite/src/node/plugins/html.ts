import path from 'path'
import type {
  OutputAsset,
  OutputBundle,
  OutputChunk,
  RollupError,
  SourceMapInput
} from 'rollup'
import MagicString from 'magic-string'
import type {
  AttributeNode,
  CompilerError,
  ElementNode,
  NodeTransform,
  TextNode
} from '@vue/compiler-dom'
import { NodeTypes } from '@vue/compiler-dom'
import { stripLiteral } from 'strip-literal'
import type { Plugin } from '../plugin'
import type { ViteDevServer } from '../server'
import {
  cleanUrl,
  generateCodeFrame,
  getHash,
  isDataUrl,
  isExternalUrl,
  isRelativeBase,
  normalizePath,
  processSrcSet,
  slash
} from '../utils'
import type { ResolvedConfig } from '../config'
import {
  assetUrlRE,
  checkPublicFile,
  getAssetFilename,
  urlToBuiltUrl
} from './asset'
import { isCSSRequest } from './css'
import { modulePreloadPolyfillId } from './modulePreloadPolyfill'

interface ScriptAssetsUrl {
  start: number
  end: number
  url: string
}

const htmlProxyRE = /\?html-proxy=?[&inline\-css]*&index=(\d+)\.(js|css)$/
const inlineCSSRE = /__VITE_INLINE_CSS__([a-z\d]{8}_\d+)__/g
// Do not allow preceding '.', but do allow preceding '...' for spread operations
const inlineImportRE =
  /(?<!(?<!\.\.)\.)\bimport\s*\(("([^"]|(?<=\\)")*"|'([^']|(?<=\\)')*')\)/g
const htmlLangRE = /\.(html|htm)$/

export const isHTMLProxy = (id: string): boolean => htmlProxyRE.test(id)

export const isHTMLRequest = (request: string): boolean =>
  htmlLangRE.test(request)

// HTML Proxy Caches are stored by config -> filePath -> index
export const htmlProxyMap = new WeakMap<
  ResolvedConfig,
  Map<string, Array<{ code: string; map?: SourceMapInput }>>
>()

// HTML Proxy Transform result are stored by config
// `${hash(importer)}_${query.index}` -> transformed css code
// PS: key like `hash(/vite/playground/assets/index.html)_1`)
export const htmlProxyResult = new Map<string, string>()

export function htmlInlineProxyPlugin(config: ResolvedConfig): Plugin {
  // Should do this when `constructor` rather than when `buildStart`,
  // `buildStart` will be triggered multiple times then the cached result will be emptied.
  // https://github.com/vitejs/vite/issues/6372
  htmlProxyMap.set(config, new Map())
  return {
    name: 'vite:html-inline-proxy',

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
        const url = file.replace(normalizePath(config.root), '')
        const result = htmlProxyMap.get(config)!.get(url)![index]
        if (result) {
          return result
        } else {
          throw new Error(`No matching HTML proxy module found from ${id}`)
        }
      }
    }
  }
}

export function addToHTMLProxyCache(
  config: ResolvedConfig,
  filePath: string,
  index: number,
  result: { code: string; map?: SourceMapInput }
): void {
  if (!htmlProxyMap.get(config)) {
    htmlProxyMap.set(config, new Map())
  }
  if (!htmlProxyMap.get(config)!.get(filePath)) {
    htmlProxyMap.get(config)!.set(filePath, [])
  }
  htmlProxyMap.get(config)!.get(filePath)![index] = result
}

export function addToHTMLProxyTransformResult(
  hash: string,
  code: string
): void {
  htmlProxyResult.set(hash, code)
}

// this extends the config in @vue/compiler-sfc with <link href>
export const assetAttrsConfig: Record<string, string[]> = {
  link: ['href'],
  video: ['src', 'poster'],
  source: ['src', 'srcset'],
  img: ['src', 'srcset'],
  image: ['xlink:href', 'href'],
  use: ['xlink:href', 'href']
}

export const isAsyncScriptMap = new WeakMap<
  ResolvedConfig,
  Map<string, boolean>
>()

export async function traverseHtml(
  html: string,
  filePath: string,
  visitor: NodeTransform
): Promise<void> {
  // lazy load compiler
  const { parse, transform } = await import('@vue/compiler-dom')
  // @vue/compiler-core doesn't like lowercase doctypes
  html = html.replace(/<!doctype\s/i, '<!DOCTYPE ')
  try {
    const ast = parse(html, { comments: true })
    transform(ast, {
      nodeTransforms: [visitor]
    })
  } catch (e) {
    handleParseError(e, html, filePath)
  }
}

export function getScriptInfo(node: ElementNode): {
  src: AttributeNode | undefined
  isModule: boolean
  isAsync: boolean
} {
  let src: AttributeNode | undefined
  let isModule = false
  let isAsync = false
  for (let i = 0; i < node.props.length; i++) {
    const p = node.props[i]
    if (p.type === NodeTypes.ATTRIBUTE) {
      if (p.name === 'src') {
        src = p
      } else if (p.name === 'type' && p.value && p.value.content === 'module') {
        isModule = true
      } else if (p.name === 'async') {
        isAsync = true
      }
    }
  }
  return { src, isModule, isAsync }
}

/**
 * Format Vue @type {CompilerError} to @type {RollupError}
 */
function formatParseError(
  compilerError: CompilerError,
  id: string,
  html: string
): RollupError {
  const formattedError: RollupError = { ...(compilerError as any) }
  if (compilerError.loc) {
    formattedError.frame = generateCodeFrame(
      html,
      compilerError.loc.start.offset
    )
    formattedError.loc = {
      file: id,
      line: compilerError.loc.start.line,
      column: compilerError.loc.start.column
    }
  }
  return formattedError
}

function handleParseError(
  compilerError: CompilerError,
  html: string,
  filePath: string
) {
  const parseError = {
    loc: filePath,
    frame: '',
    ...formatParseError(compilerError, filePath, html)
  }
  throw new Error(
    `Unable to parse HTML; ${compilerError.message}\n at ${JSON.stringify(
      parseError.loc
    )}\n${parseError.frame}`
  )
}

/**
 * Compiles index.html into an entry js module
 */
export function buildHtmlPlugin(config: ResolvedConfig): Plugin {
  const [preHooks, postHooks] = resolveHtmlTransforms(config.plugins)
  const processedHtml = new Map<string, string>()
  const isExcludedUrl = (url: string) =>
    url.startsWith('#') ||
    isExternalUrl(url) ||
    isDataUrl(url) ||
    checkPublicFile(url, config)
  // Same reason with `htmlInlineProxyPlugin`
  isAsyncScriptMap.set(config, new Map())

  return {
    name: 'vite:build-html',

    async transform(html, id) {
      if (id.endsWith('.html')) {
        const relativeUrlPath = slash(path.relative(config.root, id))
        const publicPath = `/${relativeUrlPath}`
        const publicBase = getPublicBase(relativeUrlPath, config)

        // pre-transform
        html = await applyHtmlTransforms(html, preHooks, {
          path: publicPath,
          filename: id
        })

        let js = ''
        const s = new MagicString(html)
        const assetUrls: AttributeNode[] = []
        const scriptUrls: ScriptAssetsUrl[] = []
        const styleUrls: ScriptAssetsUrl[] = []
        let inlineModuleIndex = -1

        let everyScriptIsAsync = true
        let someScriptsAreAsync = false
        let someScriptsAreDefer = false

        await traverseHtml(html, id, (node) => {
          if (node.type !== NodeTypes.ELEMENT) {
            return
          }

          let shouldRemove = false

          // script tags
          if (node.tag === 'script') {
            const { src, isModule, isAsync } = getScriptInfo(node)

            const url = src && src.value && src.value.content
            const isPublicFile = !!(url && checkPublicFile(url, config))
            if (isPublicFile) {
              // referencing public dir url, prefix with base
              s.overwrite(
                src!.value!.loc.start.offset,
                src!.value!.loc.end.offset,
                `"${normalizePublicPath(url, publicBase)}"`,
                { contentOnly: true }
              )
            }

            if (isModule) {
              inlineModuleIndex++
              if (url && !isExcludedUrl(url)) {
                // <script type="module" src="..."/>
                // add it as an import
                js += `\nimport ${JSON.stringify(url)}`
                shouldRemove = true
              } else if (node.children.length) {
                const contents = node.children
                  .map((child: any) => child.content || '')
                  .join('')
                // <script type="module">...</script>
                const filePath = id.replace(normalizePath(config.root), '')
                addToHTMLProxyCache(config, filePath, inlineModuleIndex, {
                  code: contents
                })
                js += `\nimport "${id}?html-proxy&index=${inlineModuleIndex}.js"`
                shouldRemove = true
              }

              everyScriptIsAsync &&= isAsync
              someScriptsAreAsync ||= isAsync
              someScriptsAreDefer ||= !isAsync
            } else if (url && !isPublicFile) {
              if (!isExcludedUrl(url)) {
                config.logger.warn(
                  `<script src="${url}"> in "${publicPath}" can't be bundled without type="module" attribute`
                )
              }
            } else if (node.children.length) {
              const scriptNode = node.children.pop()! as TextNode
              const cleanCode = stripLiteral(scriptNode.content)

              let match: RegExpExecArray | null
              while ((match = inlineImportRE.exec(cleanCode))) {
                const { 1: url, index } = match
                const startUrl = cleanCode.indexOf(url, index)
                const start = startUrl + 1
                const end = start + url.length - 2
                scriptUrls.push({
                  start: start + scriptNode.loc.start.offset,
                  end: end + scriptNode.loc.start.offset,
                  url: scriptNode.content.slice(start, end)
                })
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
                // assetsUrl may be encodeURI
                const url = decodeURI(p.value.content)
                if (!isExcludedUrl(url)) {
                  if (node.tag === 'link' && isCSSRequest(url)) {
                    // CSS references, convert to import
                    const importExpression = `\nimport ${JSON.stringify(url)}`
                    styleUrls.push({
                      url,
                      start: node.loc.start.offset,
                      end: node.loc.end.offset
                    })
                    js += importExpression
                  } else {
                    assetUrls.push(p)
                  }
                } else if (checkPublicFile(url, config)) {
                  s.overwrite(
                    p.value.loc.start.offset,
                    p.value.loc.end.offset,
                    `"${normalizePublicPath(url, publicBase)}"`,
                    { contentOnly: true }
                  )
                }
              }
            }
          }
          // <tag style="... url(...) ..."></tag>
          // extract inline styles as virtual css and add class attribute to tag for selecting
          const inlineStyle = node.props.find(
            (prop) =>
              prop.name === 'style' &&
              prop.type === NodeTypes.ATTRIBUTE &&
              prop.value &&
              prop.value.content.includes('url(') // only url(...) in css need to emit file
          ) as AttributeNode
          if (inlineStyle) {
            inlineModuleIndex++
            // replace `inline style` to class
            // and import css in js code
            const styleNode = inlineStyle.value!
            const code = styleNode.content!
            const filePath = id.replace(normalizePath(config.root), '')
            addToHTMLProxyCache(config, filePath, inlineModuleIndex, { code })
            // will transform with css plugin and cache result with css-post plugin
            js += `\nimport "${id}?html-proxy&inline-css&index=${inlineModuleIndex}.css"`
            const hash = getHash(cleanUrl(id))
            // will transform in `applyHtmlTransforms`
            s.overwrite(
              styleNode.loc.start.offset,
              styleNode.loc.end.offset,
              `"__VITE_INLINE_CSS__${hash}_${inlineModuleIndex}__"`,
              { contentOnly: true }
            )
          }

          // <style>...</style>
          if (node.tag === 'style' && node.children.length) {
            const styleNode = node.children.pop() as TextNode
            const filePath = id.replace(normalizePath(config.root), '')
            inlineModuleIndex++
            addToHTMLProxyCache(config, filePath, inlineModuleIndex, {
              code: styleNode.content
            })
            js += `\nimport "${id}?html-proxy&inline-css&index=${inlineModuleIndex}.css"`
            const hash = getHash(cleanUrl(id))
            // will transform in `applyHtmlTransforms`
            s.overwrite(
              styleNode.loc.start.offset,
              styleNode.loc.end.offset,
              `__VITE_INLINE_CSS__${hash}_${inlineModuleIndex}__`,
              { contentOnly: true }
            )
          }

          if (shouldRemove) {
            // remove the script tag from the html. we are going to inject new
            // ones in the end.
            s.remove(node.loc.start.offset, node.loc.end.offset)
          }
        })

        isAsyncScriptMap.get(config)!.set(id, everyScriptIsAsync)

        if (someScriptsAreAsync && someScriptsAreDefer) {
          config.logger.warn(
            `\nMixed async and defer script modules in ${id}, output script will fallback to defer. Every script, including inline ones, need to be marked as async for your output script to be async.`
          )
        }

        // for each encountered asset url, rewrite original html so that it
        // references the post-build location, ignoring empty attributes and
        // attributes that directly reference named output.
        const namedOutput = Object.keys(
          config?.build?.rollupOptions?.input || {}
        )
        for (const attr of assetUrls) {
          const value = attr.value!
          // assetsUrl may be encodeURI
          const content = decodeURI(value.content)
          if (
            content !== '' && // Empty attribute
            !namedOutput.includes(content) && // Direct reference to named output
            !namedOutput.includes(content.replace(/^\//, '')) // Allow for absolute references as named output can't be an absolute path
          ) {
            try {
              const url =
                attr.name === 'srcset'
                  ? await processSrcSet(content, ({ url }) =>
                      urlToBuiltUrl(url, id, config, this)
                    )
                  : await urlToBuiltUrl(content, id, config, this)

              s.overwrite(
                value.loc.start.offset,
                value.loc.end.offset,
                `"${url}"`,
                { contentOnly: true }
              )
            } catch (e) {
              if (e.code !== 'ENOENT') {
                throw e
              }
            }
          }
        }
        // emit <script>import("./aaa")</script> asset
        for (const { start, end, url } of scriptUrls) {
          if (!isExcludedUrl(url)) {
            s.overwrite(
              start,
              end,
              await urlToBuiltUrl(url, id, config, this),
              { contentOnly: true }
            )
          } else if (checkPublicFile(url, config)) {
            s.overwrite(start, end, normalizePublicPath(url, publicBase), {
              contentOnly: true
            })
          }
        }

        // ignore <link rel="stylesheet"> if its url can't be resolved
        const resolvedStyleUrls = await Promise.all(
          styleUrls.map(async (styleUrl) => ({
            ...styleUrl,
            resolved: await this.resolve(styleUrl.url, id)
          }))
        )
        for (const { start, end, url, resolved } of resolvedStyleUrls) {
          if (resolved == null) {
            config.logger.warnOnce(
              `\n${url} doesn't exist at build time, it will remain unchanged to be resolved at runtime`
            )
            const importExpression = `\nimport ${JSON.stringify(url)}`
            js = js.replace(importExpression, '')
          } else {
            s.remove(start, end)
          }
        }

        processedHtml.set(id, s.toString())

        // inject module preload polyfill only when configured and needed
        if (
          config.build.polyfillModulePreload &&
          (someScriptsAreAsync || someScriptsAreDefer)
        ) {
          js = `import "${modulePreloadPolyfillId}";\n${js}`
        }

        return js
      }
    },

    async generateBundle(options, bundle) {
      const analyzedChunk: Map<OutputChunk, number> = new Map()
      const getImportedChunks = (
        chunk: OutputChunk,
        seen: Set<string> = new Set()
      ): OutputChunk[] => {
        const chunks: OutputChunk[] = []
        chunk.imports.forEach((file) => {
          const importee = bundle[file]
          if (importee?.type === 'chunk' && !seen.has(file)) {
            seen.add(file)

            // post-order traversal
            chunks.push(...getImportedChunks(importee, seen))
            chunks.push(importee)
          }
        })
        return chunks
      }

      const toScriptTag = (
        chunk: OutputChunk,
        publicBase: string,
        isAsync: boolean
      ): HtmlTagDescriptor => ({
        tag: 'script',
        attrs: {
          ...(isAsync ? { async: true } : {}),
          type: 'module',
          crossorigin: true,
          src: toPublicPath(chunk.fileName, publicBase)
        }
      })

      const toPreloadTag = (
        chunk: OutputChunk,
        publicBase: string
      ): HtmlTagDescriptor => ({
        tag: 'link',
        attrs: {
          rel: 'modulepreload',
          crossorigin: true,
          href: toPublicPath(chunk.fileName, publicBase)
        }
      })

      const getCssTagsForChunk = (
        chunk: OutputChunk,
        publicBase: string,
        seen: Set<string> = new Set()
      ): HtmlTagDescriptor[] => {
        const tags: HtmlTagDescriptor[] = []
        if (!analyzedChunk.has(chunk)) {
          analyzedChunk.set(chunk, 1)
          chunk.imports.forEach((file) => {
            const importee = bundle[file]
            if (importee?.type === 'chunk') {
              tags.push(...getCssTagsForChunk(importee, publicBase, seen))
            }
          })
        }

        chunk.viteMetadata.importedCss.forEach((file) => {
          if (!seen.has(file)) {
            seen.add(file)
            tags.push({
              tag: 'link',
              attrs: {
                rel: 'stylesheet',
                href: toPublicPath(file, publicBase)
              }
            })
          }
        })

        return tags
      }

      for (const [id, html] of processedHtml) {
        const relativeUrlPath = path.posix.relative(config.root, id)
        const publicBase = getPublicBase(relativeUrlPath, config)

        const isAsync = isAsyncScriptMap.get(config)!.get(id)!

        let result = html

        // find corresponding entry chunk
        const chunk = Object.values(bundle).find(
          (chunk) =>
            chunk.type === 'chunk' &&
            chunk.isEntry &&
            chunk.facadeModuleId === id
        ) as OutputChunk | undefined

        let canInlineEntry = false

        // inject chunk asset links
        if (chunk) {
          // an entry chunk can be inlined if
          //  - it's an ES module (e.g. not generated by the legacy plugin)
          //  - it contains no meaningful code other than import statements
          if (options.format === 'es' && isEntirelyImport(chunk.code)) {
            canInlineEntry = true
          }

          // when not inlined, inject <script> for entry and modulepreload its dependencies
          // when inlined, discard entry chunk and inject <script> for everything in post-order
          const imports = getImportedChunks(chunk)
          const assetTags = canInlineEntry
            ? imports.map((chunk) => toScriptTag(chunk, publicBase, isAsync))
            : [
                toScriptTag(chunk, publicBase, isAsync),
                ...imports.map((i) => toPreloadTag(i, publicBase))
              ]

          assetTags.push(...getCssTagsForChunk(chunk, publicBase))

          result = injectToHead(result, assetTags)
        }

        // inject css link when cssCodeSplit is false
        if (!config.build.cssCodeSplit) {
          const cssChunk = Object.values(bundle).find(
            (chunk) => chunk.type === 'asset' && chunk.name === 'style.css'
          ) as OutputAsset | undefined
          if (cssChunk) {
            result = injectToHead(result, [
              {
                tag: 'link',
                attrs: {
                  rel: 'stylesheet',
                  href: toPublicPath(cssChunk.fileName, publicBase)
                }
              }
            ])
          }
        }

        // no use assets plugin because it will emit file
        let match: RegExpExecArray | null
        let s: MagicString | undefined
        while ((match = inlineCSSRE.exec(result))) {
          s ||= new MagicString(result)
          const { 0: full, 1: scopedName } = match
          const cssTransformedCode = htmlProxyResult.get(scopedName)!
          s.overwrite(
            match.index,
            match.index + full.length,
            cssTransformedCode,
            { contentOnly: true }
          )
        }
        if (s) {
          result = s.toString()
        }
        result = await applyHtmlTransforms(result, postHooks, {
          path: '/' + relativeUrlPath,
          filename: id,
          bundle,
          chunk
        })
        // resolve asset url references
        result = result.replace(assetUrlRE, (_, fileHash, postfix = '') => {
          return publicBase + getAssetFilename(fileHash, config) + postfix
        })

        if (chunk && canInlineEntry) {
          // all imports from entry have been inlined to html, prevent rollup from outputting it
          delete bundle[chunk.fileName]
        }

        const shortEmitName = path.relative(config.root, id)
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
  attrs?: Record<string, string | boolean | undefined>
  children?: string | HtmlTagDescriptor[]
  /**
   * default: 'head-prepend'
   */
  injectTo?: 'head' | 'body' | 'head-prepend' | 'body-prepend'
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
  originalUrl?: string
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

export function resolveHtmlTransforms(
  plugins: readonly Plugin[]
): [IndexHtmlTransformHook[], IndexHtmlTransformHook[]] {
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
  hooks: IndexHtmlTransformHook[],
  ctx: IndexHtmlTransformContext
): Promise<string> {
  const headTags: HtmlTagDescriptor[] = []
  const headPrependTags: HtmlTagDescriptor[] = []
  const bodyTags: HtmlTagDescriptor[] = []
  const bodyPrependTags: HtmlTagDescriptor[] = []

  for (const hook of hooks) {
    const res = await hook(html, ctx)
    if (!res) {
      continue
    }
    if (typeof res === 'string') {
      html = res
    } else {
      let tags: HtmlTagDescriptor[]
      if (Array.isArray(res)) {
        tags = res
      } else {
        html = res.html || html
        tags = res.tags
      }
      for (const tag of tags) {
        if (tag.injectTo === 'body') {
          bodyTags.push(tag)
        } else if (tag.injectTo === 'body-prepend') {
          bodyPrependTags.push(tag)
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
  if (bodyPrependTags.length) {
    html = injectToBody(html, bodyPrependTags, true)
  }
  if (bodyTags.length) {
    html = injectToBody(html, bodyTags)
  }

  return html
}

const importRE = /\bimport\s*("[^"]*[^\\]"|'[^']*[^\\]');*/g
const commentRE = /\/\*[\s\S]*?\*\/|\/\/.*$/gm
function isEntirelyImport(code: string) {
  // only consider "side-effect" imports, which match <script type=module> semantics exactly
  // the regexes will remove too little in some exotic cases, but false-negatives are alright
  return !code.replace(importRE, '').replace(commentRE, '').trim().length
}

function getPublicBase(urlRelativePath: string, config: ResolvedConfig) {
  return isRelativeBase(config.base)
    ? path.posix.join(
        path.posix.relative(urlRelativePath, '').slice(0, -2),
        './'
      )
    : config.base
}

function toPublicPath(filename: string, publicBase: string) {
  return isExternalUrl(filename) ? filename : publicBase + filename
}

function normalizePublicPath(publicPath: string, publicBase: string) {
  return publicBase + publicPath.slice(1)
}

const headInjectRE = /([ \t]*)<\/head>/i
const headPrependInjectRE = /([ \t]*)<head[^>]*>/i

const htmlInjectRE = /<\/html>/i
const htmlPrependInjectRE = /([ \t]*)<html[^>]*>/i

const bodyInjectRE = /([ \t]*)<\/body>/i
const bodyPrependInjectRE = /([ \t]*)<body[^>]*>/i

const doctypePrependInjectRE = /<!doctype html>/i

function injectToHead(
  html: string,
  tags: HtmlTagDescriptor[],
  prepend = false
) {
  if (prepend) {
    // inject as the first element of head
    if (headPrependInjectRE.test(html)) {
      return html.replace(
        headPrependInjectRE,
        (match, p1) => `${match}\n${serializeTags(tags, incrementIndent(p1))}`
      )
    }
  } else {
    // inject before head close
    if (headInjectRE.test(html)) {
      // respect indentation of head tag
      return html.replace(
        headInjectRE,
        (match, p1) => `${serializeTags(tags, incrementIndent(p1))}${match}`
      )
    }
    // try to inject before the body tag
    if (bodyPrependInjectRE.test(html)) {
      return html.replace(
        bodyPrependInjectRE,
        (match, p1) => `${serializeTags(tags, p1)}\n${match}`
      )
    }
  }
  // if no head tag is present, we prepend the tag for both prepend and append
  return prependInjectFallback(html, tags)
}

function injectToBody(
  html: string,
  tags: HtmlTagDescriptor[],
  prepend = false
) {
  if (prepend) {
    // inject after body open
    if (bodyPrependInjectRE.test(html)) {
      return html.replace(
        bodyPrependInjectRE,
        (match, p1) => `${match}\n${serializeTags(tags, incrementIndent(p1))}`
      )
    }
    // if no there is no body tag, inject after head or fallback to prepend in html
    if (headInjectRE.test(html)) {
      return html.replace(
        headInjectRE,
        (match, p1) => `${match}\n${serializeTags(tags, p1)}`
      )
    }
    return prependInjectFallback(html, tags)
  } else {
    // inject before body close
    if (bodyInjectRE.test(html)) {
      return html.replace(
        bodyInjectRE,
        (match, p1) => `${serializeTags(tags, incrementIndent(p1))}${match}`
      )
    }
    // if no body tag is present, append to the html tag, or at the end of the file
    if (htmlInjectRE.test(html)) {
      return html.replace(htmlInjectRE, `${serializeTags(tags)}\n$&`)
    }
    return html + `\n` + serializeTags(tags)
  }
}

function prependInjectFallback(html: string, tags: HtmlTagDescriptor[]) {
  // prepend to the html tag, append after doctype, or the document start
  if (htmlPrependInjectRE.test(html)) {
    return html.replace(htmlPrependInjectRE, `$&\n${serializeTags(tags)}`)
  }
  if (doctypePrependInjectRE.test(html)) {
    return html.replace(doctypePrependInjectRE, `$&\n${serializeTags(tags)}`)
  }
  return serializeTags(tags) + html
}

const unaryTags = new Set(['link', 'meta', 'base'])

function serializeTag(
  { tag, attrs, children }: HtmlTagDescriptor,
  indent: string = ''
): string {
  if (unaryTags.has(tag)) {
    return `<${tag}${serializeAttrs(attrs)}>`
  } else {
    return `<${tag}${serializeAttrs(attrs)}>${serializeTags(
      children,
      incrementIndent(indent)
    )}</${tag}>`
  }
}

function serializeTags(
  tags: HtmlTagDescriptor['children'],
  indent: string = ''
): string {
  if (typeof tags === 'string') {
    return tags
  } else if (tags && tags.length) {
    return tags.map((tag) => `${indent}${serializeTag(tag, indent)}\n`).join('')
  }
  return ''
}

function serializeAttrs(attrs: HtmlTagDescriptor['attrs']): string {
  let res = ''
  for (const key in attrs) {
    if (typeof attrs[key] === 'boolean') {
      res += attrs[key] ? ` ${key}` : ``
    } else {
      res += ` ${key}=${JSON.stringify(attrs[key])}`
    }
  }
  return res
}

function incrementIndent(indent: string = '') {
  return `${indent}${indent[0] === '\t' ? '\t' : '  '}`
}
