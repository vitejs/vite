import type { DepOptimizationMetadata } from 'vite'

export interface Options {
  /**
   * Paths to files that should be taken into account when determining whether to clear the cache.
   * By default will use the vite config file and your package lock file (for npm, yarn or pnpm).
   */
  cacheVersionFromFiles?: string[]
  /**
   * Manual version string that should be taken into account when determining whether to clear the cache.
   * Will be added to the hash of `cacheVersionFromFiles`.
   */
  cacheVersion?: string
  /**
   * Exclude requests from being cached.
   */
  exclude?: (url: string) => boolean
  /**
   * Name of the cache directory.
   * If you have multiple vite servers running (e.g. Nuxt), you can use this to differentiate them.
   * @default 'server-cache'
   */
  cacheDir?: string
}

export interface ResolvedOptions {
  cacheDir: string
  cacheVersionFromFiles: string[]
  cacheVersion: string
  exclude?: (url: string) => boolean
}

export interface CacheManifest {
  version: string
  modules: Record<string, CacheEntry>
  files: Record<string, CacheFile>
}

export interface CacheEntry {
  id: string
  url?: string
  file: string
  fileCode: string
  fileMap?: string
  fullData?: FullCacheEntryData
}

export interface FullCacheEntryData {
  importedModules: { id: string; file: string; url: string }[]
  importedBindings: Record<string, string[]>
  acceptedHmrDeps: string[]
  acceptedHmrExports: string[]
  isSelfAccepting?: boolean
  ssr: boolean
}

export interface CacheFile {
  relatedModules: Record<string, string>
}

export interface ManifestManager {
  manifest: CacheManifest
  queueManifestWrite: () => void
}

export interface DepsMetadataManager {
  getDepsMetadata: () => DepOptimizationMetadata['optimized'] | null
  updateDepsMetadata: (
    metadata: DepOptimizationMetadata['optimized'],
  ) => Promise<void>
}
