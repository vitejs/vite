import type { ResolvedConfig } from '..'
import type { Plugin } from '../plugin'
import { bareImportRE } from '../utils'
import { getDepsOptimizer } from '../optimizer'
import { tryOptimizedResolve } from './resolve'

/**
 * A plugin to avoid an aliased AND optimized dep from being aliased in src
 */
export function preAliasPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:pre-alias',
    async resolveId(id, importer, options) {
      const depsOptimizer = getDepsOptimizer(config)
      if (
        depsOptimizer &&
        !options?.ssr &&
        bareImportRE.test(id) &&
        !options?.scan
      ) {
        return await tryOptimizedResolve(depsOptimizer, id, importer)
      }
    }
  }
}
