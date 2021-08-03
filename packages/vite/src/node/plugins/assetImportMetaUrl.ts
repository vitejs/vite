import { Plugin } from '../plugin'
import MagicString from 'magic-string'
import path from 'path'
import { fileToUrl } from './asset'
import { ResolvedConfig } from '../config'

/**
 * Convert `new URL('./foo.png', import.meta.url)` to its resolved built URL
 *
 * Supports tempalte string with dynamic segments:
 * ```
 * new URL(`./dir/${name}.png`, import.meta.url)
 * // transformed to
 * import.meta.globEager('./dir/**.png')[`./dir/${name}.png`].default
 * ```
 */
export function assetImportMetaUrlPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'asset-import-meta-url',
    async transform(code, id, ssr) {
      if (code.includes('new URL') && code.includes(`import.meta.url`)) {
        const importMetaUrlRE =
          /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\)/g
        let s: MagicString | null = null
        let match: RegExpExecArray | null
        while ((match = importMetaUrlRE.exec(code))) {
          const { 0: exp, 1: rawUrl, index } = match

          if (ssr) {
            this.error(
              `\`new URL(url, import.meta.url)\` is not supported in SSR.`,
              index
            )
          }

          if (!s) s = new MagicString(code)

          // potential dynamic template string
          if (rawUrl[0] === '`' && /\$\{/.test(rawUrl)) {
            const ast = this.parse(rawUrl)
            const templateLiteral = (ast as any).body[0].expression
            if (templateLiteral.expressions.length) {
              const pattern = buildGlobPattern(templateLiteral)
              // Note: native import.meta.url is not supported in the baseline
              // target so we use window.location here -
              s.overwrite(
                index,
                index + exp.length,
                `new URL(import.meta.globEagerDefault(${JSON.stringify(
                  pattern
                )})[${rawUrl}], window.location)`
              )
              continue
            }
          }

          const url = rawUrl.slice(1, -1)
          const file = path.resolve(path.dirname(id), url)
          const builtUrl = await fileToUrl(file, config, this)
          s.overwrite(
            index,
            index + exp.length,
            `new URL(${JSON.stringify(builtUrl)}, window.location)`
          )
        }
        if (s) {
          return {
            code: s.toString(),
            map: config.build.sourcemap ? s.generateMap({ hires: true }) : null
          }
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
