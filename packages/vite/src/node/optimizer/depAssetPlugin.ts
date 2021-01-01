import path from 'path'
import { Plugin } from 'rollup'
import { init, parse } from 'es-module-lexer'
import { isCSSRequest } from '../plugins/css'
import MagicString from 'magic-string'
import { bareImportRE, normalizePath, resolveFrom } from '../utils'
import { ResolvedConfig } from '../config'

export const depAssetExternalPlugin = (config: ResolvedConfig): Plugin => ({
  name: 'vite:dep-assets-external',
  resolveId(id) {
    if (isCSSRequest(id) || config.assetsInclude(id)) {
      return {
        id,
        external: true
      }
    }
  }
})

export const depAssetRewritePlugin = (config: ResolvedConfig): Plugin => {
  return {
    name: 'vite:dep-assets-rewrite',
    async transform(code, id) {
      if (id.endsWith('.js')) {
        await init
        const [imports] = parse(code)
        if (imports.length) {
          let s: MagicString | undefined
          for (let i = 0; i < imports.length; i++) {
            const {
              s: start,
              e: end,
              d: dynamicIndex,
              ss: statementStart,
              se: statementEnd
            } = imports[i]
            if (dynamicIndex === -1) {
              const importee = code.slice(start, end)
              if (isCSSRequest(importee) || config.assetsInclude(importee)) {
                // replace css/asset imports to deep imports to their original
                // location
                s = s || new MagicString(code)
                // #903 rollup-plugin-commonjs will inject proxy helper,
                // it is unnecessary for assets
                if (importee.endsWith('?commonjs-proxy')) {
                  s.remove(statementStart, statementEnd)
                  continue
                }
                const deepPath = `/@fs/${normalizePath(
                  bareImportRE.test(importee)
                    ? resolveFrom(config.root, importee)
                    : path.resolve(path.dirname(id), importee)
                )}`
                s.overwrite(start, end, deepPath)
              }
            } else {
              // ignore dynamic import
            }
          }
          if (s) {
            return s.toString()
          }
        }
      }
      return null
    }
  }
}
