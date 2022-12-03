import path from 'node:path'
import type {
  OutputAsset,
  OutputBundle,
  OutputChunk,
  RollupError,
  SourceMapInput,
} from 'rollup'
import MagicString from 'magic-string'
import colors from 'picocolors'
import type { DefaultTreeAdapterMap, ParserError, Token } from 'parse5'
import { stripLiteral } from 'strip-literal'
import type { Plugin } from '../plugin'
import type { ViteDevServer } from '../server'
import {
  cleanUrl,
  generateCodeFrame,
  getHash,
  isDataUrl,
  isExternalUrl,
  normalizePath,
  processSrcSet,
} from '../utils'
import type { ResolvedConfig } from '../config'
import { toOutputFilePathInHtml } from '../build'
import {
  assetUrlRE,
  checkPublicFile,
  getPublicAssetFilename,
  publicAssetUrlRE,
  urlToBuiltUrl,
} from './asset'
import { isCSSRequest } from './css'
import { modulePreloadPolyfillId } from './modulePreloadPolyfill'

interface ScriptAssetsUrl {
  start: number
  end: number
  url: string
}

const htmlProxyRE = /\?html-proxy=?(?:&inline-css)?&index=(\d+)\.(js|css)$/
const inlineCSSRE = /__VITE_INLINE_CSS__([a-z\d]{8}_\d+)__/g
// Do not allow preceding '.', but do allow preceding '...' for spread operations
const inlineImportRE =
  /(?<!(?<!\.\.)\.)\bimport\s*\(("(?:[^"]|(?<=\\)")*"|'(?:[^']|(?<=\\)')*')\)/g
const htmlLangRE = /\.(?:html|htm)$/

const importMapRE =
  /[ \t]*<script[^>]*type\s*=\s*(?:"importmap"|'importmap'|importmap)[^>]*>.*?<\/script>/is
const moduleScriptRE =
  /[ \t]*<script[^>]*type\s*=\s*(?:"module"|'module'|module)[^>]*>/i

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
    },
  }
}

export function addToHTMLProxyCache(
  config: ResolvedConfig,
  filePath: string,
  index: number,
  result: { code: string; map?: SourceMapInput },
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
  code: string,
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
  use: ['xlink:href', 'href'],
}

export const isAsyncScriptMap = new WeakMap<
  ResolvedConfig,
  Map<string, boolean>
>()

export function nodeIsElement(
  node: DefaultTreeAdapterMap['node'],
): node is DefaultTreeAdapterMap['element'] {
  return node.nodeName[0] !== '#'
}

function traverseNodes(
  node: DefaultTreeAdapterMap['node'],
  visitor: (node: DefaultTreeAdapterMap['node']) => void,
) {
  visitor(node)
  if (
    nodeIsElement(node) ||
    node.nodeName === '#document' ||
    node.nodeName === '#document-fragment'
  ) {
    node.childNodes.forEach((childNode) => traverseNodes(childNode, visitor))
  }
}

export async function traverseHtml(
  html: string,
  filePath: string,
  visitor: (node: DefaultTreeAdapterMap['node']) => void,
): Promise<void> {
  // lazy load compiler
  const { parse } = await import('parse5')
  const ast = parse(html, {
    sourceCodeLocationInfo: true,
    onParseError: (e: ParserError) => {
      handleParseError(e, html, filePath)
    },
  })
  traverseNodes(ast, visitor)
}

export function getScriptInfo(node: DefaultTreeAdapterMap['element']): {
  src: Token.Attribute | undefined
  sourceCodeLocation: Token.Location | undefined
  isModule: boolean
  isAsync: boolean
} {
  let src: Token.Attribute | undefined
  let sourceCodeLocation: Token.Location | undefined
  let isModule = false
  let isAsync = false
  for (const p of node.attrs) {
    if (p.prefix !== undefined) continue
    if (p.name === 'src') {
      if (!src) {
        src = p
        sourceCodeLocation = node.sourceCodeLocation?.attrs!['src']
      }
    } else if (p.name === 'type' && p.value && p.value === 'module') {
      isModule = true
    } else if (p.name === 'async') {
      isAsync = true
    }
  }
  return { src, sourceCodeLocation, isModule, isAsync }
}

const attrValueStartRE = /=\s*(.)/

export function overwriteAttrValue(
  s: MagicString,
  sourceCodeLocation: Token.Location,
  newValue: string,
): MagicString {
  const srcString = s.slice(
    sourceCodeLocation.startOffset,
    sourceCodeLocation.endOffset,
  )
  const valueStart = srcString.match(attrValueStartRE)
  if (!valueStart) {
    // overwrite attr value can only be called for a well-defined value
    throw new Error(
      `[vite:html] internal error, failed to overwrite attribute value`,
    )
  }
  const wrapOffset = valueStart[1] === '"' || valueStart[1] === "'" ? 1 : 0
  const valueOffset = valueStart.index! + valueStart[0].length - 1
  s.update(
    sourceCodeLocation.startOffset + valueOffset + wrapOffset,
    sourceCodeLocation.endOffset - wrapOffset,
    newValue,
  )
  return s
}

/**
 * Format parse5 @type {ParserError} to @type {RollupError}
 */
function formatParseError(
  parserError: ParserError,
  id: string,
  html: string,
): RollupError {
  const formattedError: RollupError = {
    code: parserError.code,
    message: `parse5 error code ${parserError.code}`,
  }
  formattedError.frame = generateCodeFrame(html, parserError.startOffset)
  formattedError.loc = {
    file: id,
    line: parserError.startLine,
    column: parserError.startCol,
  }
  return formattedError
}

function handleParseError(
  parserError: ParserError,
  html: string,
  filePath: string,
) {
  switch (parserError.code) {
    case 'missing-doctype':
      // ignore missing DOCTYPE
      return
    case 'abandoned-head-element-child':
      // Accept elements without closing tag in <head>
      return
    case 'duplicate-attribute':
      // Accept duplicate attributes #9566
      // The first attribute is used, browsers silently ignore duplicates
      return
    case 'non-void-html-element-start-tag-with-trailing-solidus':
      // Allow self closing on non-void elements #10439
      return
  }
  const parseError = {
    loc: filePath,
    frame: '',
    ...formatParseError(parserError, filePath, html),
  }
  throw new Error(
    `Unable to parse HTML; ${parseError.message}\n at ${JSON.stringify(
      parseError.loc,
    )}\n${parseError.frame}`,
  )
}

/**
 * Compiles index.html into an entry js module
 */
export function buildHtmlPlugin(config: ResolvedConfig): Plugin {
  const [preHooks, normalHooks, postHooks] = resolveHtmlTransforms(
    config.plugins,
  )
  preHooks.unshift(preImportMapHook(config))
  postHooks.push(postImportMapHook())
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
        const relativeUrlPath = path.posix.relative(
          config.root,
          normalizePath(id),
        )
        const publicPath = `/${relativeUrlPath}`
        const publicBase = getBaseInHTML(relativeUrlPath, config)

        const publicToRelative = (filename: string, importer: string) =>
          publicBase + filename
        const toOutputPublicFilePath = (url: string) =>
          toOutputFilePathInHtml(
            url.slice(1),
            'public',
            relativeUrlPath,
            'html',
            config,
            publicToRelative,
          )

        // pre-transform
        html = await applyHtmlTransforms(html, preHooks, {
          path: publicPath,
          filename: id,
        })

        let js = ''
        const s = new MagicString(html)
        const assetUrls: {
          attr: Token.Attribute
          sourceCodeLocation: Token.Location
        }[] = []
        const scriptUrls: ScriptAssetsUrl[] = []
        const styleUrls: ScriptAssetsUrl[] = []
        let inlineModuleIndex = -1

        let everyScriptIsAsync = true
        let someScriptsAreAsync = false
        let someScriptsAreDefer = false

        await traverseHtml(html, id, (node) => {
          if (!nodeIsElement(node)) {
            return
          }

          let shouldRemove = false

          // script tags
          if (node.nodeName === 'script') {
            const { src, sourceCodeLocation, isModule, isAsync } =
              getScriptInfo(node)

            const url = src && src.value
            const isPublicFile = !!(url && checkPublicFile(url, config))
            if (isPublicFile) {
              // referencing public dir url, prefix with base
              overwriteAttrValue(
                s,
                sourceCodeLocation!,
                toOutputPublicFilePath(url),
              )
            }

            if (isModule) {
              inlineModuleIndex++
              if (url && !isExcludedUrl(url)) {
                // <script type="module" src="..."/>
                // add it as an import
                js += `\nimport ${JSON.stringify(url)}`
                shouldRemove = true
              } else if (node.childNodes.length) {
                const scriptNode =
                  node.childNodes.pop() as DefaultTreeAdapterMap['textNode']
                const contents = scriptNode.value
                // <script type="module">...</script>
                const filePath = id.replace(normalizePath(config.root), '')
                addToHTMLProxyCache(config, filePath, inlineModuleIndex, {
                  code: contents,
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
                  `<script src="${url}"> in "${publicPath}" can't be bundled without type="module" attribute`,
                )
              }
            } else if (node.childNodes.length) {
              const scriptNode =
                node.childNodes.pop() as DefaultTreeAdapterMap['textNode']
              const cleanCode = stripLiteral(scriptNode.value)

              let match: RegExpExecArray | null
              inlineImportRE.lastIndex = 0
              while ((match = inlineImportRE.exec(cleanCode))) {
                const { 1: url, index } = match
                const startUrl = cleanCode.indexOf(url, index)
                const start = startUrl + 1
                const end = start + url.length - 2
                const startOffset = scriptNode.sourceCodeLocation!.startOffset
                scriptUrls.push({
                  start: start + startOffset,
                  end: end + startOffset,
                  url: scriptNode.value.slice(start, end),
                })
              }
            }
          }

          // For asset references in index.html, also generate an import
          // statement for each - this will be handled by the asset plugin
          const assetAttrs = assetAttrsConfig[node.nodeName]
          if (assetAttrs) {
            for (const p of node.attrs) {
              const attrKey = getAttrKey(p)
              if (p.value && assetAttrs.includes(attrKey)) {
                const attrSourceCodeLocation =
                  node.sourceCodeLocation!.attrs![attrKey]
                // assetsUrl may be encodeURI
                const url = decodeURI(p.value)
                if (!isExcludedUrl(url)) {
                  if (
                    node.nodeName === 'link' &&
                    isCSSRequest(url) &&
                    // should not be converted if following attributes are present (#6748)
                    !node.attrs.some(
                      (p) =>
                        p.prefix === undefined &&
                        (p.name === 'media' || p.name === 'disabled'),
                    )
                  ) {
                    // CSS references, convert to import
                    const importExpression = `\nimport ${JSON.stringify(url)}`
                    styleUrls.push({
                      url,
                      start: node.sourceCodeLocation!.startOffset,
                      end: node.sourceCodeLocation!.endOffset,
                    })
                    js += importExpression
                  } else {
                    assetUrls.push({
                      attr: p,
                      sourceCodeLocation: attrSourceCodeLocation,
                    })
                  }
                } else if (checkPublicFile(url, config)) {
                  overwriteAttrValue(
                    s,
                    attrSourceCodeLocation,
                    toOutputPublicFilePath(url),
                  )
                }
              }
            }
          }
          // <tag style="... url(...) ..."></tag>
          // extract inline styles as virtual css and add class attribute to tag for selecting
          const inlineStyle = node.attrs.find(
            (prop) =>
              prop.prefix === undefined &&
              prop.name === 'style' &&
              prop.value.includes('url('), // only url(...) in css need to emit file
          )
          if (inlineStyle) {
            inlineModuleIndex++
            // replace `inline style` to class
            // and import css in js code
            const code = inlineStyle.value
            const filePath = id.replace(normalizePath(config.root), '')
            addToHTMLProxyCache(config, filePath, inlineModuleIndex, { code })
            // will transform with css plugin and cache result with css-post plugin
            js += `\nimport "${id}?html-proxy&inline-css&index=${inlineModuleIndex}.css"`
            const hash = getHash(cleanUrl(id))
            // will transform in `applyHtmlTransforms`
            const sourceCodeLocation = node.sourceCodeLocation!.attrs!['style']
            overwriteAttrValue(
              s,
              sourceCodeLocation,
              `__VITE_INLINE_CSS__${hash}_${inlineModuleIndex}__`,
            )
          }

          // <style>...</style>
          if (node.nodeName === 'style' && node.childNodes.length) {
            const styleNode =
              node.childNodes.pop() as DefaultTreeAdapterMap['textNode']
            const filePath = id.replace(normalizePath(config.root), '')
            inlineModuleIndex++
            addToHTMLProxyCache(config, filePath, inlineModuleIndex, {
              code: styleNode.value,
            })
            js += `\nimport "${id}?html-proxy&inline-css&index=${inlineModuleIndex}.css"`
            const hash = getHash(cleanUrl(id))
            // will transform in `applyHtmlTransforms`
            s.update(
              styleNode.sourceCodeLocation!.startOffset,
              styleNode.sourceCodeLocation!.endOffset,
              `__VITE_INLINE_CSS__${hash}_${inlineModuleIndex}__`,
            )
          }

          if (shouldRemove) {
            // remove the script tag from the html. we are going to inject new
            // ones in the end.
            s.remove(
              node.sourceCodeLocation!.startOffset,
              node.sourceCodeLocation!.endOffset,
            )
          }
        })

        isAsyncScriptMap.get(config)!.set(id, everyScriptIsAsync)

        if (someScriptsAreAsync && someScriptsAreDefer) {
          config.logger.warn(
            `\nMixed async and defer script modules in ${id}, output script will fallback to defer. Every script, including inline ones, need to be marked as async for your output script to be async.`,
          )
        }

        // for each encountered asset url, rewrite original html so that it
        // references the post-build location, ignoring empty attributes and
        // attributes that directly reference named output.
        const namedOutput = Object.keys(
          config?.build?.rollupOptions?.input || {},
        )
        for (const { attr, sourceCodeLocation } of assetUrls) {
          // assetsUrl may be encodeURI
          const content = decodeURI(attr.value)
          if (
            content !== '' && // Empty attribute
            !namedOutput.includes(content) && // Direct reference to named output
            !namedOutput.includes(content.replace(/^\//, '')) // Allow for absolute references as named output can't be an absolute path
          ) {
            try {
              const url =
                attr.prefix === undefined && attr.name === 'srcset'
                  ? await processSrcSet(content, ({ url }) =>
                      urlToBuiltUrl(url, id, config, this),
                    )
                  : await urlToBuiltUrl(content, id, config, this)

              overwriteAttrValue(s, sourceCodeLocation, url)
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
            s.update(start, end, await urlToBuiltUrl(url, id, config, this))
          } else if (checkPublicFile(url, config)) {
            s.update(start, end, toOutputPublicFilePath(url))
          }
        }

        // ignore <link rel="stylesheet"> if its url can't be resolved
        const resolvedStyleUrls = await Promise.all(
          styleUrls.map(async (styleUrl) => ({
            ...styleUrl,
            resolved: await this.resolve(styleUrl.url, id),
          })),
        )
        for (const { start, end, url, resolved } of resolvedStyleUrls) {
          if (resolved == null) {
            config.logger.warnOnce(
              `\n${url} doesn't exist at build time, it will remain unchanged to be resolved at runtime`,
            )
            const importExpression = `\nimport ${JSON.stringify(url)}`
            js = js.replace(importExpression, '')
          } else {
            s.remove(start, end)
          }
        }

        processedHtml.set(id, s.toString())

        // inject module preload polyfill only when configured and needed
        const { modulePreload } = config.build
        if (
          (modulePreload === true ||
            (typeof modulePreload === 'object' && modulePreload.polyfill)) &&
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
        seen: Set<string> = new Set(),
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
        toOutputPath: (filename: string) => string,
        isAsync: boolean,
      ): HtmlTagDescriptor => ({
        tag: 'script',
        attrs: {
          ...(isAsync ? { async: true } : {}),
          type: 'module',
          crossorigin: true,
          src: toOutputPath(chunk.fileName),
        },
      })

      const toPreloadTag = (
        filename: string,
        toOutputPath: (filename: string) => string,
      ): HtmlTagDescriptor => ({
        tag: 'link',
        attrs: {
          rel: 'modulepreload',
          crossorigin: true,
          href: toOutputPath(filename),
        },
      })

      const getCssTagsForChunk = (
        chunk: OutputChunk,
        toOutputPath: (filename: string) => string,
        seen: Set<string> = new Set(),
      ): HtmlTagDescriptor[] => {
        const tags: HtmlTagDescriptor[] = []
        if (!analyzedChunk.has(chunk)) {
          analyzedChunk.set(chunk, 1)
          chunk.imports.forEach((file) => {
            const importee = bundle[file]
            if (importee?.type === 'chunk') {
              tags.push(...getCssTagsForChunk(importee, toOutputPath, seen))
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
                href: toOutputPath(file),
              },
            })
          }
        })

        return tags
      }

      for (const [id, html] of processedHtml) {
        const relativeUrlPath = path.posix.relative(
          config.root,
          normalizePath(id),
        )
        const assetsBase = getBaseInHTML(relativeUrlPath, config)
        const toOutputFilePath = (
          filename: string,
          type: 'asset' | 'public',
        ) => {
          if (isExternalUrl(filename)) {
            return filename
          } else {
            return toOutputFilePathInHtml(
              filename,
              type,
              relativeUrlPath,
              'html',
              config,
              (filename: string, importer: string) => assetsBase + filename,
            )
          }
        }

        const toOutputAssetFilePath = (filename: string) =>
          toOutputFilePath(filename, 'asset')

        const toOutputPublicAssetFilePath = (filename: string) =>
          toOutputFilePath(filename, 'public')

        const isAsync = isAsyncScriptMap.get(config)!.get(id)!

        let result = html

        // find corresponding entry chunk
        const chunk = Object.values(bundle).find(
          (chunk) =>
            chunk.type === 'chunk' &&
            chunk.isEntry &&
            chunk.facadeModuleId === id,
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
          let assetTags: HtmlTagDescriptor[]
          if (canInlineEntry) {
            assetTags = imports.map((chunk) =>
              toScriptTag(chunk, toOutputAssetFilePath, isAsync),
            )
          } else {
            const { modulePreload } = config.build
            const resolveDependencies =
              typeof modulePreload === 'object' &&
              modulePreload.resolveDependencies
            const importsFileNames = imports.map((chunk) => chunk.fileName)
            const resolvedDeps = resolveDependencies
              ? resolveDependencies(chunk.fileName, importsFileNames, {
                  hostId: relativeUrlPath,
                  hostType: 'html',
                })
              : importsFileNames
            assetTags = [
              toScriptTag(chunk, toOutputAssetFilePath, isAsync),
              ...resolvedDeps.map((i) =>
                toPreloadTag(i, toOutputAssetFilePath),
              ),
            ]
          }
          assetTags.push(...getCssTagsForChunk(chunk, toOutputAssetFilePath))

          result = injectToHead(result, assetTags)
        }

        // inject css link when cssCodeSplit is false
        if (!config.build.cssCodeSplit) {
          const cssChunk = Object.values(bundle).find(
            (chunk) => chunk.type === 'asset' && chunk.name === 'style.css',
          ) as OutputAsset | undefined
          if (cssChunk) {
            result = injectToHead(result, [
              {
                tag: 'link',
                attrs: {
                  rel: 'stylesheet',
                  href: toOutputAssetFilePath(cssChunk.fileName),
                },
              },
            ])
          }
        }

        // no use assets plugin because it will emit file
        let match: RegExpExecArray | null
        let s: MagicString | undefined
        inlineCSSRE.lastIndex = 0
        while ((match = inlineCSSRE.exec(result))) {
          s ||= new MagicString(result)
          const { 0: full, 1: scopedName } = match
          const cssTransformedCode = htmlProxyResult.get(scopedName)!
          s.update(match.index, match.index + full.length, cssTransformedCode)
        }
        if (s) {
          result = s.toString()
        }
        result = await applyHtmlTransforms(
          result,
          [...normalHooks, ...postHooks],
          {
            path: '/' + relativeUrlPath,
            filename: id,
            bundle,
            chunk,
          },
        )
        // resolve asset url references
        result = result.replace(assetUrlRE, (_, fileHash, postfix = '') => {
          return toOutputAssetFilePath(this.getFileName(fileHash)) + postfix
        })

        result = result.replace(publicAssetUrlRE, (_, fileHash) => {
          return normalizePath(
            toOutputPublicAssetFilePath(
              getPublicAssetFilename(fileHash, config)!,
            ),
          )
        })

        if (chunk && canInlineEntry) {
          // all imports from entry have been inlined to html, prevent rollup from outputting it
          delete bundle[chunk.fileName]
        }

        const shortEmitName = normalizePath(path.relative(config.root, id))
        this.emitFile({
          type: 'asset',
          fileName: shortEmitName,
          source: result,
        })
      }
    },
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
  this: void,
  html: string,
  ctx: IndexHtmlTransformContext,
) => IndexHtmlTransformResult | void | Promise<IndexHtmlTransformResult | void>

export type IndexHtmlTransform =
  | IndexHtmlTransformHook
  | {
      order?: 'pre' | 'post' | null
      /**
       * @deprecated renamed to `order`
       */
      enforce?: 'pre' | 'post'
      /**
       * @deprecated renamed to `handler`
       */
      transform: IndexHtmlTransformHook
    }
  | {
      order?: 'pre' | 'post' | null
      /**
       * @deprecated renamed to `order`
       */
      enforce?: 'pre' | 'post'
      handler: IndexHtmlTransformHook
    }

export function preImportMapHook(
  config: ResolvedConfig,
): IndexHtmlTransformHook {
  return (html, ctx) => {
    const importMapIndex = html.match(importMapRE)?.index
    if (importMapIndex === undefined) return

    const moduleScriptIndex = html.match(moduleScriptRE)?.index
    if (moduleScriptIndex === undefined) return

    if (moduleScriptIndex < importMapIndex) {
      const relativeHtml = normalizePath(
        path.relative(config.root, ctx.filename),
      )
      config.logger.warnOnce(
        colors.yellow(
          colors.bold(
            `(!) <script type="importmap"> should come before <script type="module"> in /${relativeHtml}`,
          ),
        ),
      )
    }
  }
}

/**
 * Move importmap before the first module script
 */
export function postImportMapHook(): IndexHtmlTransformHook {
  return (html) => {
    if (!moduleScriptRE.test(html)) return

    let importMap: string | undefined
    html = html.replace(importMapRE, (match) => {
      importMap = match
      return ''
    })
    if (importMap) {
      html = html.replace(moduleScriptRE, (match) => `${importMap}\n${match}`)
    }

    return html
  }
}

export function resolveHtmlTransforms(
  plugins: readonly Plugin[],
): [
  IndexHtmlTransformHook[],
  IndexHtmlTransformHook[],
  IndexHtmlTransformHook[],
] {
  const preHooks: IndexHtmlTransformHook[] = []
  const normalHooks: IndexHtmlTransformHook[] = []
  const postHooks: IndexHtmlTransformHook[] = []

  for (const plugin of plugins) {
    const hook = plugin.transformIndexHtml
    if (!hook) continue

    if (typeof hook === 'function') {
      normalHooks.push(hook)
    } else {
      // `enforce` had only two possible values for the `transformIndexHtml` hook
      // `'pre'` and `'post'` (the default). `order` now works with three values
      // to align with other hooks (`'pre'`, normal, and `'post'`). We map
      // both `enforce: 'post'` to `order: undefined` to avoid a breaking change
      const order = hook.order ?? (hook.enforce === 'pre' ? 'pre' : undefined)
      // @ts-expect-error union type
      const handler = hook.handler ?? hook.transform
      if (order === 'pre') {
        preHooks.push(handler)
      } else if (order === 'post') {
        postHooks.push(handler)
      } else {
        normalHooks.push(handler)
      }
    }
  }

  return [preHooks, normalHooks, postHooks]
}

export async function applyHtmlTransforms(
  html: string,
  hooks: IndexHtmlTransformHook[],
  ctx: IndexHtmlTransformContext,
): Promise<string> {
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

      const headTags: HtmlTagDescriptor[] = []
      const headPrependTags: HtmlTagDescriptor[] = []
      const bodyTags: HtmlTagDescriptor[] = []
      const bodyPrependTags: HtmlTagDescriptor[] = []

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

      html = injectToHead(html, headPrependTags, true)
      html = injectToHead(html, headTags)
      html = injectToBody(html, bodyPrependTags, true)
      html = injectToBody(html, bodyTags)
    }
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

function getBaseInHTML(urlRelativePath: string, config: ResolvedConfig) {
  // Prefer explicit URL if defined for linking to assets and public files from HTML,
  // even when base relative is specified
  return config.base === './' || config.base === ''
    ? path.posix.join(
        path.posix.relative(urlRelativePath, '').slice(0, -2),
        './',
      )
    : config.base
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
  prepend = false,
) {
  if (tags.length === 0) return html

  if (prepend) {
    // inject as the first element of head
    if (headPrependInjectRE.test(html)) {
      return html.replace(
        headPrependInjectRE,
        (match, p1) => `${match}\n${serializeTags(tags, incrementIndent(p1))}`,
      )
    }
  } else {
    // inject before head close
    if (headInjectRE.test(html)) {
      // respect indentation of head tag
      return html.replace(
        headInjectRE,
        (match, p1) => `${serializeTags(tags, incrementIndent(p1))}${match}`,
      )
    }
    // try to inject before the body tag
    if (bodyPrependInjectRE.test(html)) {
      return html.replace(
        bodyPrependInjectRE,
        (match, p1) => `${serializeTags(tags, p1)}\n${match}`,
      )
    }
  }
  // if no head tag is present, we prepend the tag for both prepend and append
  return prependInjectFallback(html, tags)
}

function injectToBody(
  html: string,
  tags: HtmlTagDescriptor[],
  prepend = false,
) {
  if (tags.length === 0) return html

  if (prepend) {
    // inject after body open
    if (bodyPrependInjectRE.test(html)) {
      return html.replace(
        bodyPrependInjectRE,
        (match, p1) => `${match}\n${serializeTags(tags, incrementIndent(p1))}`,
      )
    }
    // if no there is no body tag, inject after head or fallback to prepend in html
    if (headInjectRE.test(html)) {
      return html.replace(
        headInjectRE,
        (match, p1) => `${match}\n${serializeTags(tags, p1)}`,
      )
    }
    return prependInjectFallback(html, tags)
  } else {
    // inject before body close
    if (bodyInjectRE.test(html)) {
      return html.replace(
        bodyInjectRE,
        (match, p1) => `${serializeTags(tags, incrementIndent(p1))}${match}`,
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
  indent: string = '',
): string {
  if (unaryTags.has(tag)) {
    return `<${tag}${serializeAttrs(attrs)}>`
  } else {
    return `<${tag}${serializeAttrs(attrs)}>${serializeTags(
      children,
      incrementIndent(indent),
    )}</${tag}>`
  }
}

function serializeTags(
  tags: HtmlTagDescriptor['children'],
  indent: string = '',
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

export function getAttrKey(attr: Token.Attribute): string {
  return attr.prefix === undefined ? attr.name : `${attr.prefix}:${attr.name}`
}
