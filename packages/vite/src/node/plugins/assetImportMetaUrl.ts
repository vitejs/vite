import path from 'node:path'
import MagicString from 'magic-string'
import { stripLiteral } from 'strip-literal'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import type { ResolveFn } from '../'
import {
  isParentDirectory,
  normalizePath,
  slash,
  transformStableResult,
} from '../utils'
import { fileToUrl } from './asset'
import { preloadHelperId } from './importAnalysisBuild'

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

  return {
    name: 'vite:asset-import-meta-url',
    async transform(code, id, options) {
      if (
        !options?.ssr &&
        id !== preloadHelperId &&
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
            const ast = this.parse(rawUrl)
            const templateLiteral = (ast as any).body[0].expression
            if (templateLiteral.expressions.length) {
              const pattern = JSON.stringify(buildGlobPattern(templateLiteral))
              // Note: native import.meta.url is not supported in the baseline
              // target so we use the global location here. It can be
              // window.location or self.location in case it is used in a Web Worker.
              // @see https://developer.mozilla.org/en-US/docs/Web/API/Window/self
              s.update(
                index,
                index + exp.length,
                `new URL((import.meta.glob(${pattern}, { eager: true, import: 'default', as: 'url' }))[${rawUrl}], self.location)`,
              )
              continue
            }
          }

          const url = rawUrl.slice(1, -1)
          let file: string | undefined
          if (url[0] === '.') {
            file = slash(path.resolve(path.dirname(id), url))
          } else {
            assetResolver ??= config.createResolver({
              extensions: [],
              mainFields: [],
              tryIndex: false,
              preferRelative: true,
            })
            file = await assetResolver(url, id)
            file ??= url.startsWith('/')
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
            `new URL(${JSON.stringify(builtUrl)}, self.location)`,
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
