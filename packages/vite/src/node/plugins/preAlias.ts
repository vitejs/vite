import path from 'node:path'
import type { Alias, AliasOptions, ResolvedConfig } from '..'
import type { Plugin } from '../plugin'
import { bareImportRE, isOptimizable, moduleListContains } from '../utils'
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
      const depsOptimizer = getDepsOptimizer(config, ssr)
      if (
        importer &&
        depsOptimizer &&
        bareImportRE.test(id) &&
        !options?.scan
      ) {
        if (findPatterns.find((pattern) => matches(pattern, id))) {
          const optimizedId = await tryOptimizedResolve(
            depsOptimizer,
            id,
            importer
          )
          if (optimizedId) {
            return optimizedId // aliased dep already optimized
          }
          const resolved = await this.resolve(id, importer, {
            skipSelf: true,
            ...options
          })
          if (resolved && !depsOptimizer.isOptimizedDepFile(resolved.id)) {
            const optimizeDeps = depsOptimizer.options
            const resolvedId = resolved.id
            const isVirtual = resolvedId === id || resolvedId.includes('\0')
            if (
              !isVirtual &&
              !moduleListContains(optimizeDeps.exclude, id) &&
              path.isAbsolute(resolvedId) &&
              (resolvedId.includes('node_modules') ||
                optimizeDeps.include?.includes(id)) &&
              isOptimizable(resolvedId, optimizeDeps)
            ) {
              // aliased dep has not yet been optimized
              const optimizedInfo = depsOptimizer!.registerMissingImport(
                id,
                resolvedId
              )
              return { id: depsOptimizer!.getOptimizedDepId(optimizedInfo) }
            }
          }
          return resolved
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
