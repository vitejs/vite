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

type ExternalList = Exclude<InternalResolveOptions['external'], true>

function resetAndTestRegExp(regexp: RegExp, value: string): boolean {
  regexp.lastIndex = 0
  return regexp.test(value)
}

function matchesExternalList(list: ExternalList, value: string): boolean {
  for (const pattern of list) {
    if (typeof pattern === 'string') {
      if (pattern === value) {
        return true
      }
    } else if (resetAndTestRegExp(pattern, value)) {
      return true
    }
  }
  return false
}

export function isIdExplicitlyExternal(
  external: InternalResolveOptions['external'],
  id: string,
): boolean {
  return external === true ? true : matchesExternalList(external, id)
}

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

export function createIsConfiguredAsExternal(
  environment: PartialEnvironment,
): (id: string, importer?: string) => boolean {
  const { config } = environment
  const { root, resolve } = config
  const { external, noExternal } = resolve
  const externalList: ExternalList | undefined =
    external === true ? undefined : external
  const noExternalFilter =
    typeof noExternal !== 'boolean' &&
    !(Array.isArray(noExternal) && noExternal.length === 0) &&
    createFilter(undefined, noExternal, { resolve: false })

  const targetConditions = resolve.externalConditions

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
    const explicitIdMatch =
      externalList && matchesExternalList(externalList, id)
    if (explicitIdMatch) {
      const canExternalize = isExternalizable(id, importer, true)
      if (!canExternalize) {
        debug?.(
          `Configured ${JSON.stringify(
            id,
          )} as external but failed to statically resolve it. ` +
            `Falling back to honoring the explicit configuration.`,
        )
      }
      return true
    }
    const pkgName = getNpmPackageName(id)
    if (!pkgName) {
      return isExternalizable(id, importer, false)
    }
    const explicitPackageMatch =
      externalList && matchesExternalList(externalList, pkgName)
    if (explicitPackageMatch) {
      const canExternalize = isExternalizable(id, importer, true)
      if (!canExternalize) {
        debug?.(
          `Configured package ${JSON.stringify(
            pkgName,
          )} as external but failed to statically resolve ${JSON.stringify(
            id,
          )}. Falling back to honoring the explicit configuration.`,
        )
      }
      return true
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
      isExternal =
        isBuiltin(environment.config.resolve.builtins, id) ||
        isConfiguredAsExternal(id, importer)
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
