import { ResolvedConfig } from '..'
import { Plugin } from '../plugin'

export const polyfillId = 'vite/dynamic-import-polyfill'

export function dynamicImportPolyfillPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:dynamic-import-polyfill',
    resolveId(id) {
      if (id === polyfillId) {
        return id
      }
    },
    load(id) {
      if (id === polyfillId) {
        config.logger.warn(
          `\nVite's dynamic import polyfill has been removed, stop importing 'vite/dynamic-import-polyfill'`
        )
        return ''
      }
    }
  }
}
