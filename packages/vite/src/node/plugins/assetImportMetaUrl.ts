import path from 'node:path'
import MagicString from 'magic-string'
import { stripLiteral } from 'strip-literal'
import { exactRegex } from '@rolldown/pluginutils'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import {
  injectQuery,
  isDataUrl,
  isParentDirectory,
  transformStableResult,
  tryStatSync,
} from '../utils'
import { CLIENT_ENTRY } from '../constants'
import { slash } from '../../shared/utils'
import { createBackCompatIdResolver } from '../idResolver'
import type { ResolveIdFn } from '../idResolver'
import { fileToUrl } from './asset'
import { preloadHelperId } from './importAnalysisBuild'
import type { InternalResolveOptions } from './resolve'
import { tryFsResolve } from './resolve'
import { hasViteIgnoreRE } from './importAnalysis'

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
  const { publicDir } = config
  let assetResolver: ResolveIdFn

  const fsResolveOptions: InternalResolveOptions = {
    ...config.resolve,
    root: config.root,
    isProduction: config.isProduction,
    isBuild: config.command === 'build',
    packageCache: config.packageCache,
    asSrc: true,
  }

  return {
    name: 'vite:asset-import-meta-url',

    applyToEnvironment(environment) {
      return environment.config.consumer === 'client'
    },

    transform: {
      filter: {
        id: {
          exclude: [exactRegex(preloadHelperId), exactRegex(CLIENT_ENTRY)],
        },
        code: /new\s+URL.+import\.meta\.url/s,
      },
      async handler(code, id) {
        let s: MagicString | undefined
        const assetImportMetaUrlRE =
          /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/dg
        const cleanString = stripLiteral(code)

        let match: RegExpExecArray | null
        while ((match = assetImportMetaUrlRE.exec(cleanString))) {
          const [[startIndex, endIndex], [urlStart, urlEnd]] = match.indices!
          if (hasViteIgnoreRE.test(code.slice(startIndex, urlStart))) continue

          const rawUrl = code.slice(urlStart, urlEnd)
          const url = rawUrl.slice(1, -1)
          if (isDataUrl(url)) {
            continue
          }
          let file: string | undefined

          if (!s) s = new MagicString(code)

          if (url.startsWith('.')) {
            file = slash(path.resolve(path.dirname(id), url))
            file = tryFsResolve(file, fsResolveOptions) ?? file
          } else {
            assetResolver ??= createBackCompatIdResolver(config, {
              extensions: [],
              mainFields: [],
              tryIndex: false,
              preferRelative: true,
            })
            file = await assetResolver(this.environment, url, id)
            file ??=
              url[0] === '/'
                ? slash(path.join(publicDir, url))
                : slash(path.resolve(path.dirname(id), url))
          }

          // Get final asset URL. If the file does not exist,
          // we fall back to the initial URL and let it resolve in runtime
          let builtUrl: string | undefined
          if (file) {
            try {
              if (publicDir && isParentDirectory(publicDir, file)) {
                const publicPath = '/' + path.posix.relative(publicDir, file)
                builtUrl = await fileToUrl(this, publicPath)
              } else {
                builtUrl = await fileToUrl(this, file)
                // during dev, builtUrl may point to a directory or a non-existing file
                if (tryStatSync(file)?.isFile()) {
                  this.addWatchFile(file)
                }
              }
            } catch {
              // do nothing, we'll log a warning after this
            }
          }
          if (!builtUrl) {
            const rawExp = code.slice(startIndex, endIndex)
            config.logger.warnOnce(
              `\n${rawExp} doesn't exist at build time, it will remain unchanged to be resolved at runtime. ` +
                `If this is intended, you can use the /* @vite-ignore */ comment to suppress this warning.`,
            )
            builtUrl = url
          }

          // potential dynamic template string
          if (rawUrl[0] === '`' && /\$\{/.test(rawUrl)) {
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
                `new URL((import.meta.glob(${pattern}, { eager: true, import: 'default', as: 'url' }))[${rawUrl}] || \`${builtUrl}\`, self.location)`,
              )
            }
          } else {
            s.update(
              index,
              index + exp.length,
              `new URL(${JSON.stringify(builtUrl)}, self.location)`,
            )
          }
        }
        if (s) {
          return transformStableResult(s, id, config)
        }
      },
    },
  }
}

function buildGlobPattern(ast: any) {
  let pattern = ''
  let lastIsGlob = false
  for (let i = 0; i < ast.quasis.length; i++) {
    const str = ast.quasis[i].value.raw
    if (str) {
      pattern += str
      lastIsGlob = false
    }

    if (ast.expressions[i] && !lastIsGlob) {
      pattern += '*'
      lastIsGlob = true
    }
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
