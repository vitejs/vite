import type { Plugin } from '../plugin'
import MagicString from 'magic-string'
import path from 'path'
import { fileToUrl } from './asset'
import type { ResolvedConfig } from '../config'
import {
  blankReplacer,
  multilineCommentsRE,
  singlelineCommentsRE
} from '../utils'
import { htmlTypesRE, scriptRE } from '../optimizer/scan'
import { JS_TYPES_RE } from '../constants'

/**
 * Convert `new URL('./foo.png', import.meta.url)` to its resolved built URL
 *
 * Supports template string with dynamic segments:
 * ```
 * new URL(`./dir/${name}.png`, import.meta.url)
 * // transformed to
 * import.meta.globEager('./dir/**.png')[`./dir/${name}.png`].default
 * ```
 */
export function assetImportMetaUrlPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:asset-import-meta-url',
    async transform(code, id, options) {
      let inHTML = false
      if (htmlTypesRE.test(id)) {
        inHTML = true
      } else if (JS_TYPES_RE.test(id)) {
        inHTML = false
      } else {
        return
      }

      if (
        options?.ssr ||
        !code.includes('new URL') ||
        !code.includes(`import.meta.url`)
      ) {
        return
      }
      let s: MagicString | undefined

      const transformAssetImportMetaUrl = async (
        snippet: string,
        start: number
      ): Promise<void> => {
        const importMetaUrlRE =
          /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*,?\s*\)/g
        const noCommentsCode = snippet
          .replace(multilineCommentsRE, blankReplacer)
          .replace(singlelineCommentsRE, blankReplacer)

        let match: RegExpExecArray | null
        while ((match = importMetaUrlRE.exec(noCommentsCode))) {
          const { 0: exp, 1: rawUrl, index: matchIndex } = match
          const index = start + matchIndex
          s ||= new MagicString(code)

          // potential dynamic template string
          if (rawUrl[0] === '`' && /\$\{/.test(rawUrl)) {
            const ast = this.parse(rawUrl)
            const templateLiteral = (ast as any).body[0].expression
            if (templateLiteral.expressions.length) {
              const pattern = buildGlobPattern(templateLiteral)
              // Note: native import.meta.url is not supported in the baseline
              // target so we use the global location here. It can be
              // window.location or self.location in case it is used in a Web Worker.
              // @see https://developer.mozilla.org/en-US/docs/Web/API/Window/self
              s.overwrite(
                index,
                index + exp.length,
                `new URL(import.meta.globEagerDefault(${JSON.stringify(
                  pattern
                )})[${rawUrl}], self.location)`,
                { contentOnly: true }
              )
              continue
            }
          }

          const url = rawUrl.slice(1, -1)
          const file = path.resolve(path.dirname(id), url)
          // Get final asset URL. Catch error if the file does not exist,
          // in which we can resort to the initial URL and let it resolve in runtime
          const builtUrl = await fileToUrl(file, config, this).catch(() => {
            config.logger.warnOnce(
              `\n${exp} doesn't exist at build time, it will remain unchanged to be resolved at runtime`
            )
            return url
          })
          s.overwrite(
            index,
            index + exp.length,
            `new URL(${JSON.stringify(builtUrl)}, self.location)`,
            { contentOnly: true }
          )
        }
      }

      if (inHTML) {
        let scriptMatch: RegExpExecArray | null = null
        while ((scriptMatch = scriptRE.exec(code))) {
          const { 0: exp, 2: script, index: scriptMatchIndex } = scriptMatch
          const index = exp.indexOf(script) + scriptMatchIndex
          await transformAssetImportMetaUrl(script, index)
        }
      } else {
        await transformAssetImportMetaUrl(code, 0)
      }

      if (s) {
        return {
          code: s.toString(),
          map: config.build.sourcemap ? s.generateMap({ hires: true }) : null
        }
      }
      return null
    }
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
