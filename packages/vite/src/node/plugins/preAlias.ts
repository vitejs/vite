import type { Alias, AliasOptions, ResolvedConfig } from '..'
import type { Plugin } from '../plugin'
import { bareImportRE } from '../utils'
import { getDepsOptimizer } from '../optimizer'
import { tryOptimizedResolve } from './resolve'

/**
 * A plugin to avoid an aliased AND optimized dep from being aliased in src
 */
export function preAliasPlugin(config: ResolvedConfig): Plugin {
  const findPatterns = getAliasPatterns(config.resolve.alias)
  return {
    name: 'vite:pre-alias',
    async resolveId(id, importer, options) {
      const ssr = options?.ssr === true
      const depsOptimizer = getDepsOptimizer(config, { ssr })
      if (
        importer &&
        depsOptimizer &&
        bareImportRE.test(id) &&
        !options?.scan
      ) {
        if (findPatterns.find((pattern) => matches(pattern, id))) {
          return await tryOptimizedResolve(depsOptimizer, id, importer)
        }
      }
    }
  }
}

// In sync with rollup plugin alias logic
function matches(pattern: string | RegExp, importee: string) {
  if (pattern instanceof RegExp) {
    return pattern.test(importee)
  }
  if (importee.length < pattern.length) {
    return false
  }
  if (importee === pattern) {
    return true
  }
  return importee.startsWith(pattern + '/')
}

function getAliasPatterns(
  entries: (AliasOptions | undefined) & Alias[]
): (string | RegExp)[] {
  if (!entries) {
    return []
  }
  if (Array.isArray(entries)) {
    return entries.map((entry) => entry.find)
  }
  return Object.entries(entries).map(([find]) => find)
}
