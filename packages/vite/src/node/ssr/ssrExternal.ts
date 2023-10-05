import path from 'node:path'
import type { InternalResolveOptions } from '../plugins/resolve'
import { tryNodeResolve } from '../plugins/resolve'
import {
  bareImportRE,
  createDebugger,
  createFilter,
  getNpmPackageName,
  isBuiltin,
} from '../utils'
import type { ResolvedConfig } from '..'

const debug = createDebugger('vite:ssr-external')

const isSsrExternalCache = new WeakMap<
  ResolvedConfig,
  (id: string, importer?: string) => boolean | undefined
>()

export function shouldExternalizeForSSR(
  id: string,
  importer: string | undefined,
  config: ResolvedConfig,
): boolean | undefined {
  let isSsrExternal = isSsrExternalCache.get(config)
  if (!isSsrExternal) {
    isSsrExternal = createIsSsrExternal(config)
    isSsrExternalCache.set(config, isSsrExternal)
  }
  return isSsrExternal(id, importer)
}

export function createIsConfiguredAsSsrExternal(
  config: ResolvedConfig,
): (id: string, importer?: string) => boolean {
  const { ssr, root } = config
  const noExternal = ssr?.noExternal
  const noExternalFilter =
    noExternal !== 'undefined' &&
    typeof noExternal !== 'boolean' &&
    createFilter(undefined, noExternal, { resolve: false })

  const targetConditions = config.ssr.resolve?.externalConditions || []

  const resolveOptions: InternalResolveOptions = {
    ...config.resolve,
    root,
    isProduction: false,
    isBuild: true,
    conditions: targetConditions,
  }

  const isExternalizable = (
    id: string,
    importer?: string,
    configuredAsExternal?: boolean,
  ): boolean => {
    if (!bareImportRE.test(id) || id.includes('\0')) {
      return false
    }
    try {
      return !!tryNodeResolve(
        id,
        // Skip passing importer in build to avoid externalizing non-hoisted dependencies
        // unresolvable from root (which would be unresolvable from output bundles also)
        config.command === 'build' ? undefined : importer,
        resolveOptions,
        ssr?.target === 'webworker',
        undefined,
        true,
        // try to externalize, will return undefined or an object without
        // a external flag if it isn't externalizable
        true,
        // Allow linked packages to be externalized if they are explicitly
        // configured as external
        !!configuredAsExternal,
      )?.external
    } catch (e) {
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
    const { ssr } = config
    if (ssr) {
      if (
        // If this id is defined as external, force it as external
        // Note that individual package entries are allowed in ssr.external
        ssr.external?.includes(id)
      ) {
        return true
      }
      const pkgName = getNpmPackageName(id)
      if (!pkgName) {
        return isExternalizable(id, importer)
      }
      if (
        // A package name in ssr.external externalizes every
        // externalizable package entry
        ssr.external?.includes(pkgName)
      ) {
        return isExternalizable(id, importer, true)
      }
      if (typeof noExternal === 'boolean') {
        return !noExternal
      }
      if (noExternalFilter && !noExternalFilter(pkgName)) {
        return false
      }
    }
    return isExternalizable(id, importer)
  }
}

function createIsSsrExternal(
  config: ResolvedConfig,
): (id: string, importer?: string) => boolean | undefined {
  const processedIds = new Map<string, boolean | undefined>()

  const isConfiguredAsExternal = createIsConfiguredAsSsrExternal(config)

  return (id: string, importer?: string) => {
    if (processedIds.has(id)) {
      return processedIds.get(id)
    }
    let external = false
    if (id[0] !== '.' && !path.isAbsolute(id)) {
      external = isBuiltin(id) || isConfiguredAsExternal(id, importer)
    }
    processedIds.set(id, external)
    return external
  }
}
