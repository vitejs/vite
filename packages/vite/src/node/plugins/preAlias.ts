import type { ResolvedConfig } from '..'
import type { Plugin } from '../plugin'
import { bareImportRE } from '../utils'
import { tryOptimizedResolve } from './resolve'

/**
 * A plugin to avoid an aliased AND optimized dep from being aliased in src
 */
export function preAliasPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:pre-alias',
    async resolveId(id, importer, options) {
      if (!options?.ssr && bareImportRE.test(id) && !options?.scan) {
        return await tryOptimizedResolve(id, config, importer)
      }
    }
  }
}
