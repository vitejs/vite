import { exactRegex } from 'rolldown/filter'
import { viteModulePreloadPolyfillPlugin as nativeModulePreloadPolyfillPlugin } from 'rolldown/experimental'
import { type ResolvedConfig, perEnvironmentPlugin } from '..'
import type { Plugin } from '../plugin'

export const modulePreloadPolyfillId = 'vite/modulepreload-polyfill'
const resolvedModulePreloadPolyfillId = '\0' + modulePreloadPolyfillId + '.js'

export function modulePreloadPolyfillPlugin(config: ResolvedConfig): Plugin {
  if (config.isBundled) {
    return perEnvironmentPlugin(
      'native:modulepreload-polyfill',
      (environment) => {
        return nativeModulePreloadPolyfillPlugin({
          isServer: environment.config.consumer !== 'client',
        })
      },
    )
  }

  return {
    name: 'vite:modulepreload-polyfill',
    resolveId: {
      filter: { id: exactRegex(modulePreloadPolyfillId) },
      handler(_id) {
        return resolvedModulePreloadPolyfillId
      },
    },
    load: {
      filter: { id: exactRegex(resolvedModulePreloadPolyfillId) },
      handler(_id) {
        // Should resolve to an empty module in dev
        return ''
      },
    },
  }
}
