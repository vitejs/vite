import path from 'node:path'
import type {
  Alias,
  AliasOptions,
  DepOptimizationOptions,
  ResolvedConfig,
} from '..'
import type { Plugin } from '../plugin'
import { isConfiguredAsExternal } from '../external'
import {
  bareImportRE,
  isInNodeModules,
  isOptimizable,
  moduleListContains,
} from '../utils'
import { getFsUtils } from '../fsUtils'
import { cleanUrl, withTrailingSlash } from '../../shared/utils'
import { tryOptimizedResolve } from './resolve'

/**
 * A plugin to avoid an aliased AND optimized dep from being aliased in src
 */
export function preAliasPlugin(config: ResolvedConfig): Plugin {
  const findPatterns = getAliasPatterns(config.resolve.alias)
  const isBuild = config.command === 'build'
  const fsUtils = getFsUtils(config)
  return {
    name: 'vite:pre-alias',
    async resolveId(id, importer, options) {
      const { environment } = this
      const ssr = environment.config.consumer === 'server'
      const depsOptimizer =
        environment.mode === 'dev' ? environment.depsOptimizer : undefined
      if (
        importer &&
        depsOptimizer &&
        bareImportRE.test(id) &&
        !options?.scan &&
        id !== '@vite/client' &&
        id !== '@vite/env'
      ) {
        if (findPatterns.find((pattern) => matches(pattern, id))) {
          const optimizedId = await tryOptimizedResolve(
            depsOptimizer,
            id,
            importer,
            config.resolve.preserveSymlinks,
            config.packageCache,
          )
          if (optimizedId) {
            return optimizedId // aliased dep already optimized
          }
          if (depsOptimizer.options.noDiscovery) {
            return
          }
          const resolved = await this.resolve(id, importer, options)
          if (resolved && !depsOptimizer.isOptimizedDepFile(resolved.id)) {
            const optimizeDeps = depsOptimizer.options
            const resolvedId = cleanUrl(resolved.id)
            const isVirtual = resolvedId === id || resolvedId.includes('\0')
            if (
              !isVirtual &&
              fsUtils.existsSync(resolvedId) &&
              !moduleListContains(optimizeDeps.exclude, id) &&
              path.isAbsolute(resolvedId) &&
              (isInNodeModules(resolvedId) ||
                optimizeDeps.include?.includes(id)) &&
              isOptimizable(resolvedId, optimizeDeps) &&
              !(
                isBuild &&
                ssr &&
                isConfiguredAsExternal(environment, id, importer)
              ) &&
              (!ssr || optimizeAliasReplacementForSSR(resolvedId, optimizeDeps))
            ) {
              // aliased dep has not yet been optimized
              const optimizedInfo = depsOptimizer!.registerMissingImport(
                id,
                resolvedId,
              )
              return { id: depsOptimizer!.getOptimizedDepId(optimizedInfo) }
            }
          }
          return resolved
        }
      }
    },
  }
}

function optimizeAliasReplacementForSSR(
  id: string,
  optimizeDeps: DepOptimizationOptions,
) {
  if (optimizeDeps.include?.includes(id)) {
    return true
  }
  // In the regular resolution, the default for non-external modules is to
  // be optimized if they are CJS. Here, we don't have the package id but
  // only the replacement file path. We could find the package.json from
  // the id and respect the same default in the future.
  // Default to not optimize an aliased replacement for now, forcing the
  // user to explicitly add it to the ssr.optimizeDeps.include list.
  return false
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
  return importee.startsWith(withTrailingSlash(pattern))
}

function getAliasPatterns(
  entries: (AliasOptions | undefined) & Alias[],
): (string | RegExp)[] {
  if (!entries) {
    return []
  }
  if (Array.isArray(entries)) {
    return entries.map((entry) => entry.find)
  }
  return Object.entries(entries).map(([find]) => find)
}

export function getAliasPatternMatcher(
  entries: (AliasOptions | undefined) & Alias[],
): (importee: string) => boolean {
  const patterns = getAliasPatterns(entries)
  return (importee: string) =>
    patterns.some((pattern) => matches(pattern, importee))
}
