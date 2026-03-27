import { exactRegex } from 'rolldown/filter'
import { type ResolvedConfig } from '..'
import type { Plugin } from '../plugin'

export const modulePreloadPolyfillId = 'vite/modulepreload-polyfill'
const resolvedModulePreloadPolyfillId = '\0' + modulePreloadPolyfillId + '.js'

export function modulePreloadPolyfillPlugin(config: ResolvedConfig): Plugin {
  // In bundled mode we intentionally use the same JS plugin path as non-bundled
  // mode. The native builtin:vite-module-preload-polyfill has an ordering issue
  // with builtin:vite-resolve in Rolldown rc.9: the resolver wins the race and
  // throws because vite/modulepreload-polyfill is not in Vite 8's exports map.
  // A JS resolveId hook placed before the resolve builtin in the plugins array
  // correctly intercepts the virtual module ID before the native resolver runs.
  return {
    name: 'vite:modulepreload-polyfill',
    applyToEnvironment: config.isBundled
      ? (environment) => environment.config.consumer === 'client'
      : undefined,
    resolveId: {
      filter: { id: exactRegex(modulePreloadPolyfillId) },
      handler(_id) {
        return resolvedModulePreloadPolyfillId
      },
    },
    load: {
      filter: { id: exactRegex(resolvedModulePreloadPolyfillId) },
      handler(_id) {
        // Returns an empty module. In dev the polyfill is injected by Vite's
        // client script. In production, native browser modulepreload support is
        // assumed for the project's target browsers.
        return ''
      },
    },
  }
}
