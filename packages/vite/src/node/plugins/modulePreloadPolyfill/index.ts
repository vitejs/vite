import type { ResolvedConfig } from '../..'
import type { Plugin } from '../../plugin'
import { isModernFlag } from '../importAnalysisBuild'
import { modulePreloadPolyfill } from './modulePreloadPolyfill'

export const modulePreloadPolyfillId = 'vite/modulepreload-polyfill'
const resolvedModulePreloadPolyfillId = '\0' + modulePreloadPolyfillId + '.js'

export function modulePreloadPolyfillPlugin(config: ResolvedConfig): Plugin {
  let polyfillString: string | undefined

  return {
    name: 'vite:modulepreload-polyfill',
    resolveId: {
      handler(id) {
        if (id === modulePreloadPolyfillId) {
          return resolvedModulePreloadPolyfillId
        }
      },
    },
    load: {
      handler(id) {
        if (id === resolvedModulePreloadPolyfillId) {
          // `isModernFlag` is only available during build since it is resolved by `vite:build-import-analysis`
          if (
            config.command !== 'build' ||
            this.environment.config.consumer !== 'client'
          ) {
            return ''
          }
          if (!polyfillString) {
            polyfillString = `${isModernFlag}&&(${modulePreloadPolyfill.toString()}());`
          }
          return { code: polyfillString, moduleSideEffects: true }
        }
      },
    },
  }
}
