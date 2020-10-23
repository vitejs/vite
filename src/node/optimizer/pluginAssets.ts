import { Plugin } from 'rollup'
import { init, parse } from 'es-module-lexer'
import { isCSSRequest } from '../utils/cssUtils'
import MagicString from 'magic-string'
import { bareImportRE, resolveFrom } from '../utils'
import path from 'path'
import { InternalResolver } from '../resolver'

export const createDepAssetExternalPlugin = (
  resolver: InternalResolver
): Plugin => ({
  name: 'vite:optimize-dep-assets-external',
  resolveId(id) {
    if (isCSSRequest(id) || resolver.isAssetRequest(id)) {
      return {
        id,
        external: true
      }
    }
  }
})

export const createDepAssetPlugin = (
  resolver: InternalResolver,
  root: string
): Plugin => {
  return {
    name: 'vite:optimize-dep-assets',
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
              if (isCSSRequest(importee) || resolver.isAssetRequest(importee)) {
                // replace css/asset imports to deep imports to their original
                // location
                s = s || new MagicString(code)
                // #903 rollup-plugin-commonjs will inject proxy helper, it is unnecessary for assets
                if (importee.endsWith('?commonjs-proxy')) {
                  s.remove(statementStart, statementEnd)
                  continue
                }
                const deepPath = resolver.fileToRequest(
                  bareImportRE.test(importee)
                    ? resolveFrom(root, importee)
                    : path.resolve(path.dirname(id), importee)
                )
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
