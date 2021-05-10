import { ResolvedConfig } from '..'
import { Plugin } from '../plugin'

export const polyfillId = 'vite/dynamic-import-polyfill'

/**
 * @deprecated 
 */
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
          `\n'vite/dynamic-import-polyfill' is no longer needed, refer to https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md#230-2021-05-10`
        )
        return ''
      }
    }
  }
}
