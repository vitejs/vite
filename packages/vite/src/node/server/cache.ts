import type { ModuleNode } from './moduleGraph.js'

export interface CacheLoadReadResult {
  /**
   * Set to `null` to prevent the file from being cached.
   */
  cacheKey: string | null
  /**
   * The result of the cached load. `null` if not cached yet.
   */
  result: {
    code: string
    map?: any
  } | null
}

export interface CacheLoadWriteOptions {
  cacheKey: string
  id: string
  file: string
  url: string
  code: string
  map?: any
  mod?: ModuleNode | null
  ssr: boolean
}

export interface CacheTransformReadResult {
  /**
   * Set to `null` to prevent the file from being cached.
   */
  cacheKey: string | null
  /**
   * The result of the cached load. `null` if not cached yet.
   */
  result: {
    code: string
    map?: any
    hmr?: {
      importedModules: Set<string>
      importedBindings: Map<string, Set<string>> | null
      acceptedModules: Set<string>
      acceptedExports: Set<string>
      isSelfAccepting: boolean
    }
  } | null
}

export interface CacheTransformWriteOptions {
  cacheKey: string
  id: string
  file: string
  url: string
  code: string
  map?: any
  mod?: ModuleNode | null
  ssr: boolean
}
