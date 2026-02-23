import isModuleSyncConditionEnabled from '#module-sync-enabled'
import { DEFAULT_EXTENSIONS } from './constants'
import { tryNodeResolve } from './plugins/resolve'
import { nodeLikeBuiltins } from './utils'

export interface NodeResolveWithViteOptions {
  root: string
  isRequire?: boolean
}

/**
 * Resolve like Node.js using Vite's resolution algorithm with preconfigured options.
 */
export function nodeResolveWithVite(
  id: string,
  importer: string | undefined,
  options: NodeResolveWithViteOptions,
): string | undefined {
  return tryNodeResolve(id, importer, {
    root: options.root,
    isBuild: true,
    isProduction: true,
    preferRelative: false,
    tryIndex: true,
    mainFields: [],
    conditions: [
      'node',
      ...(isModuleSyncConditionEnabled ? ['module-sync'] : []),
    ],
    externalConditions: [],
    external: [],
    noExternal: [],
    dedupe: [],
    extensions: DEFAULT_EXTENSIONS,
    preserveSymlinks: false,
    tsconfigPaths: false,
    // Intentionally disable package cache for now as consumers don't need it
    packageCache: undefined,
    isRequire: options.isRequire,
    builtins: nodeLikeBuiltins,
    disableOptionalPeerDepHandling: true,
  })?.id
}
