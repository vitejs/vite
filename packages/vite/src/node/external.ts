import path from 'node:path'
import type { InternalResolveOptions } from './plugins/resolve'
import { tryNodeResolve } from './plugins/resolve'
import {
  bareImportRE,
  createDebugger,
  createFilter,
  getNpmPackageName,
  isBuiltin,
  isInNodeModules,
} from './utils'
import type { Environment } from './environment'
import type { PartialEnvironment } from './baseEnvironment'

const debug = createDebugger('vite:external')

const isExternalCache = new WeakMap<
  Environment,
  (id: string, importer?: string) => boolean
>()

export function shouldExternalize(
  environment: Environment,
  id: string,
  importer: string | undefined,
): boolean {
  let isExternal = isExternalCache.get(environment)
  if (!isExternal) {
    isExternal = createIsExternal(environment)
    isExternalCache.set(environment, isExternal)
  }
  return isExternal(id, importer)
}

const isConfiguredAsExternalCache = new WeakMap<
  Environment,
  (id: string, importer?: string) => boolean
>()

export function isConfiguredAsExternal(
  environment: Environment,
  id: string,
  importer?: string,
): boolean {
  let isExternal = isConfiguredAsExternalCache.get(environment)
  if (!isExternal) {
    isExternal = createIsConfiguredAsExternal(environment)
    isConfiguredAsExternalCache.set(environment, isExternal)
  }
  return isExternal(id, importer)
}

export function createIsConfiguredAsExternal(
  environment: PartialEnvironment,
): (id: string, importer?: string) => boolean {
  const { config } = environment
  const { root, resolve } = config
  const { external, noExternal } = resolve
  const noExternalFilter =
    typeof noExternal !== 'boolean' &&
    !(Array.isArray(noExternal) && noExternal.length === 0) &&
    createFilter(undefined, noExternal, { resolve: false })

  const targetConditions = resolve.externalConditions || []

  const resolveOptions: InternalResolveOptions = {
    ...resolve,
    root,
    isProduction: false,
    isBuild: true,
    conditions: targetConditions,
  }

  const isExternalizable = (
    id: string,
    importer: string | undefined,
    configuredAsExternal: boolean,
  ): boolean => {
    if (!bareImportRE.test(id) || id.includes('\0')) {
      return false
    }
    try {
      const resolved = tryNodeResolve(
        id,
        // Skip passing importer in build to avoid externalizing non-hoisted dependencies
        // unresolvable from root (which would be unresolvable from output bundles also)
        config.command === 'build' ? undefined : importer,
        resolveOptions,
        undefined,
        false,
      )
      if (!resolved) {
        return false
      }
      // Only allow linked packages to be externalized
      // if they are explicitly configured as external
      if (!configuredAsExternal && !isInNodeModules(resolved.id)) {
        return false
      }
      return canExternalizeFile(resolved.id)
    } catch {
      debug?.(
        `Failed to node resolve "${id}". Skipping externalizing it by default.`,
      )
      // may be an invalid import that's resolved by a plugin
      return false
    }
  }

  // Returns true if it is configured as external, false if it is filtered
  // by noExternal and undefined if it isn't affected by the explicit config
  return (id: string, importer?: string) => {
    if (
      // If this id is defined as external, force it as external
      // Note that individual package entries are allowed in `external`
      external !== true &&
      external.includes(id)
    ) {
      return true
    }
    const pkgName = getNpmPackageName(id)
    if (!pkgName) {
      return isExternalizable(id, importer, false)
    }
    if (
      // A package name in ssr.external externalizes every
      // externalizable package entry
      external !== true &&
      external.includes(pkgName)
    ) {
      return isExternalizable(id, importer, true)
    }
    if (typeof noExternal === 'boolean') {
      return !noExternal
    }
    if (noExternalFilter && !noExternalFilter(pkgName)) {
      return false
    }
    // If external is true, all will be externalized by default, regardless if
    // it's a linked package
    return isExternalizable(id, importer, external === true)
  }
}

function createIsExternal(
  environment: Environment,
): (id: string, importer?: string) => boolean {
  const processedIds = new Map<string, boolean>()

  const isConfiguredAsExternal = createIsConfiguredAsExternal(environment)

  return (id: string, importer?: string) => {
    if (processedIds.has(id)) {
      return processedIds.get(id)!
    }
    let isExternal = false
    if (id[0] !== '.' && !path.isAbsolute(id)) {
      isExternal = isBuiltin(id) || isConfiguredAsExternal(id, importer)
    }
    processedIds.set(id, isExternal)
    return isExternal
  }
}

export function canExternalizeFile(filePath: string): boolean {
  const ext = path.extname(filePath)
  // only external js imports
  return !ext || ext === '.js' || ext === '.mjs' || ext === '.cjs'
}
