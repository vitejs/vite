import path from 'node:path'
import MagicString from 'magic-string'
import { stripLiteral } from 'strip-literal'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import type { ResolveFn } from '../'
import {
  injectQuery,
  isParentDirectory,
  normalizePath,
  slash,
  transformStableResult,
} from '../utils'
import { CLIENT_ENTRY } from '../constants'
import { fileToUrl } from './asset'
import { preloadHelperId } from './importAnalysisBuild'
import type { InternalResolveOptions } from './resolve'
import { tryFsResolve } from './resolve'

/**
 * Convert `new URL('./foo.png', import.meta.url)` to its resolved built URL
 *
 * Supports template string with dynamic segments:
 * ```
 * new URL(`./dir/${name}.png`, import.meta.url)
 * // transformed to
 * import.meta.glob('./dir/**.png', { eager: true, import: 'default' })[`./dir/${name}.png`]
 * ```
 */
export function assetImportMetaUrlPlugin(config: ResolvedConfig): Plugin {
  const normalizedPublicDir = normalizePath(config.publicDir)
  let assetResolver: ResolveFn

  const fsResolveOptions: InternalResolveOptions = {
    ...config.resolve,
    root: config.root,
    isProduction: config.isProduction,
    isBuild: config.command === 'build',
    packageCache: config.packageCache,
    ssrConfig: config.ssr,
    asSrc: true,
  }

  return {
    name: 'vite:asset-import-meta-url',
    async transform(code, id, options) {
      if (
        !options?.ssr &&
        id !== preloadHelperId &&
        id !== CLIENT_ENTRY &&
        code.includes('new URL') &&
        code.includes(`import.meta.url`)
      ) {
        let s: MagicString | undefined
        const assetImportMetaUrlRE =
          /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/g
        const cleanString = stripLiteral(code)

        let match: RegExpExecArray | null
        while ((match = assetImportMetaUrlRE.exec(cleanString))) {
          const { 0: exp, 1: emptyUrl, index } = match

          const urlStart = cleanString.indexOf(emptyUrl, index)
          const urlEnd = urlStart + emptyUrl.length
          const rawUrl = code.slice(urlStart, urlEnd)

          if (!s) s = new MagicString(code)

          // potential dynamic template string
          if (rawUrl[0] === '`' && rawUrl.includes('${')) {
            const queryDelimiterIndex = getQueryDelimiterIndex(rawUrl)
            const hasQueryDelimiter = queryDelimiterIndex !== -1
            const pureUrl = hasQueryDelimiter
              ? rawUrl.slice(0, queryDelimiterIndex) + '`'
              : rawUrl
            const queryString = hasQueryDelimiter
              ? rawUrl.slice(queryDelimiterIndex, -1)
              : ''
            const ast = this.parse(pureUrl)
            const templateLiteral = (ast as any).body[0].expression
            if (templateLiteral.expressions.length) {
              const pattern = buildGlobPattern(templateLiteral)
              if (pattern.startsWith('**')) {
                // don't transform for patterns like this
                // because users won't intend to do that in most cases
                continue
              }

              const globOptions = {
                eager: true,
                import: 'default',
                // A hack to allow 'as' & 'query' exist at the same time
                query: injectQuery(queryString, 'url'),
              }
              s.update(
                index,
                index + exp.length,
                `new URL((import.meta.glob(${JSON.stringify(
                  pattern,
                )}, ${JSON.stringify(
                  globOptions,
                )}))[${pureUrl}], import.meta.url)`,
              )
              continue
            }
          }

          const url = rawUrl.slice(1, -1)
          let file: string | undefined
          if (url[0] === '.') {
            file = slash(path.resolve(path.dirname(id), url))
            file = tryFsResolve(file, fsResolveOptions) ?? file
          } else {
            assetResolver ??= config.createResolver({
              extensions: [],
              mainFields: [],
              tryIndex: false,
              preferRelative: true,
            })
            file = await assetResolver(url, id)
            file ??=
              url[0] === '/'
                ? slash(path.join(config.publicDir, url))
                : slash(path.resolve(path.dirname(id), url))
          }

          // Get final asset URL. If the file does not exist,
          // we fall back to the initial URL and let it resolve in runtime
          let builtUrl: string | undefined
          if (file) {
            try {
              if (isParentDirectory(normalizedPublicDir, file)) {
                const publicPath =
                  '/' + path.posix.relative(normalizedPublicDir, file)
                builtUrl = await fileToUrl(publicPath, config, this)
              } else {
                builtUrl = await fileToUrl(file, config, this)
              }
            } catch {
              // do nothing, we'll log a warning after this
            }
          }
          if (!builtUrl) {
            const rawExp = code.slice(index, index + exp.length)
            config.logger.warnOnce(
              `\n${rawExp} doesn't exist at build time, it will remain unchanged to be resolved at runtime`,
            )
            builtUrl = url
          }
          s.update(
            index,
            index + exp.length,
            `new URL(${JSON.stringify(builtUrl)}, import.meta.url)`,
          )
        }
        if (s) {
          return transformStableResult(s, id, config)
        }
      }
      return null
    },
  }
}

function buildGlobPattern(ast: any) {
  let pattern = ''
  let lastElementIndex = -1
  for (const exp of ast.expressions) {
    for (let i = lastElementIndex + 1; i < ast.quasis.length; i++) {
      const el = ast.quasis[i]
      if (el.end < exp.start) {
        pattern += el.value.raw
        lastElementIndex = i
      }
    }
    pattern += '**'
  }
  for (let i = lastElementIndex + 1; i < ast.quasis.length; i++) {
    pattern += ast.quasis[i].value.raw
  }
  return pattern
}

function getQueryDelimiterIndex(rawUrl: string): number {
  let bracketsStack = 0
  for (let i = 0; i < rawUrl.length; i++) {
    if (rawUrl[i] === '{') {
      bracketsStack++
    } else if (rawUrl[i] === '}') {
      bracketsStack--
    } else if (rawUrl[i] === '?' && bracketsStack === 0) {
      return i
    }
  }
  return -1
}
