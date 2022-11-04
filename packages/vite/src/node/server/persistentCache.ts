import fs from 'node:fs'
import path from 'node:path'
import colors from 'picocolors'
import type { DepOptimizationMetadata } from '../index'
import type {
  InlineConfig,
  ResolvedConfig,
  ResolvedServerPersistentCacheOptions
} from '../config'
import { normalizePath, version } from '../publicUtils'
import { createDebugger, getCodeHash, isDefined, lookupFile } from '../utils'
import type { Logger } from '../logger'
import type { ModuleNode } from './moduleGraph'

export interface PersistentCache {
  manifest: PersistentCacheManifest
  getKey: (code: string) => string
  read: (key: string) => Promise<PersistentCacheResult | null>
  write: (
    key: string,
    id: string,
    url: string | undefined,
    mod: ModuleNode | null,
    ssr: boolean,
    file: string,
    code: string,
    map?: any
  ) => Promise<void>
  queueManifestWrite: () => void
  updateDepsMetadata: (metadata: DepOptimizationMetadata) => Promise<void>
}

export interface PersistentCacheManifest {
  version: string
  modules: Record<string, PersistentCacheEntry>
  files: Record<string, PersistentCacheFile>
}

export interface PersistentSimpleCacheEntry {
  id: string
  url?: string
  file: string
  fileCode: string
  fileMap?: string
}

export interface PersistentFullCacheEntry extends PersistentSimpleCacheEntry {
  importedModules: { id: string; file: string; url: string }[]
  importedBindings: Record<string, string[]>
  acceptedHmrDeps: string[]
  acceptedHmrExports: string[]
  isSelfAccepting?: boolean
  ssr: boolean
}

export type PersistentCacheEntry =
  | PersistentSimpleCacheEntry
  | PersistentFullCacheEntry

export function isFullCacheEntry(
  entry: PersistentCacheEntry
): entry is PersistentFullCacheEntry {
  return Array.isArray((entry as PersistentFullCacheEntry).importedModules)
}

export interface PersistentCacheResult {
  code: string
  map?: any
}

export interface PersistentCacheFile {
  relatedModules: Record<string, string>
}

const debugLog = createDebugger('vite:persistent-cache')

export async function createPersistentCache(
  config: ResolvedConfig
): Promise<PersistentCache | null> {
  const {
    logger,
    experimental: { serverPersistentCaching: options }
  } = config

  if (!options) {
    return null
  }

  // Cache directory

  const resolvedCacheDir = normalizePath(path.resolve(options.cacheDir))

  if (!fs.existsSync(resolvedCacheDir)) {
    fs.mkdirSync(resolvedCacheDir, { recursive: true })
  }

  // Cache version

  const cacheVersion = await computeCacheVersion(config, options)

  // Manifest

  const { manifest, queueManifestWrite } = await useCacheManifest(
    resolvedCacheDir,
    cacheVersion,
    logger
  )

  // Main methods

  function getKey(code: string) {
    return getCodeHash(code)
  }

  async function read(key: string): Promise<PersistentCacheResult | null> {
    const entry = manifest.modules[key]
    if (!entry) {
      return null
    }

    try {
      debugLog(`read ${key}`)
      const code = await fs.promises.readFile(entry.fileCode, 'utf8')
      const map = entry.fileMap
        ? JSON.parse(await fs.promises.readFile(entry.fileMap, 'utf8'))
        : undefined

      return {
        code,
        map
      }
    } catch (e) {
      logger.warn(
        colors.yellow(
          `Failed to read persistent cache entry '${key}' (${entry.file}): ${e.message}`
        )
      )
      return null
    }
  }

  async function write(
    key: string,
    id: string,
    url: string | undefined,
    mod: ModuleNode | null,
    ssr: boolean,
    file: string,
    code: string,
    map?: any
  ) {
    try {
      debugLog(`write ${key}`)
      const fileCode = path.resolve(resolvedCacheDir, 'c-' + key)
      const fileMap = map ? fileCode + '-map' : undefined

      // Rewrite optimized deps imports using the final browserHash
      // The version query will change after first time they are optimized
      // (They are not updated during first run to keep urls stable)
      if (depsMetadata && mod) {
        for (const m of mod.importedModules) {
          if (m.file) {
            for (const depId in depsMetadata.optimized) {
              const dep = depsMetadata.optimized[depId]
              if (dep.file === m.file) {
                code = code.replaceAll(
                  m.url,
                  m.url.replace(/v=[\w\d]+/, `v=${depsMetadata.browserHash}`)
                )
                break
              }
            }
          }
        }
      }

      // Create cache entry

      const entry: PersistentCacheEntry = {
        id,
        url,
        file,
        fileCode,
        fileMap,
        ssr
      }

      if (mod) {
        const fullEntry = entry as PersistentFullCacheEntry
        fullEntry.importedModules = Array.from(mod.importedModules)
          .filter((m) => !!m.id && !!m.file)
          .map((m) => ({
            id: m.id!,
            url: m.url,
            file: m.file!
          }))
        const importedBindings: any = {}
        if (mod.importedBindings) {
          for (const k in mod.importedBindings) {
            const s = mod.importedBindings.get(k)
            if (s) {
              importedBindings[k] = Array.from(s)
            }
          }
        }
        fullEntry.importedBindings = importedBindings

        fullEntry.acceptedHmrDeps = Array.from(mod.acceptedHmrDeps)
          .map((m) => m.url)
          .filter(isDefined)

        fullEntry.acceptedHmrExports = mod.acceptedHmrExports
          ? (Array.from(mod.acceptedHmrExports).filter(Boolean) as string[])
          : []

        fullEntry.isSelfAccepting = mod.isSelfAccepting
      }

      manifest.modules[key] = entry

      queueManifestWrite()

      // Write files

      await fs.promises.writeFile(fileCode, code, 'utf8')
      if (map && fileMap) {
        await fs.promises.writeFile(fileMap, JSON.stringify(map), 'utf8')
      }
    } catch (e) {
      logger.warn(
        colors.yellow(
          `Failed to write persistent cache entry '${key}' (${file}): ${e.message}`
        )
      )
    }
  }

  // Optimized deps

  let depsMetadata: DepOptimizationMetadata | null = null

  async function updateDepsMetadata(metadata: DepOptimizationMetadata) {
    depsMetadata = metadata

    // Update existing cache files
    await Promise.all(
      Object.keys(manifest.modules).map(async (key) => {
        const entry = manifest.modules[key]
        if (entry && isFullCacheEntry(entry)) {
          // Gather code changes
          const optimizedDeps: [string, string][] = []
          for (const m of entry.importedModules) {
            for (const depId in metadata.optimized) {
              const dep = metadata.optimized[depId]
              if (dep.file === m.file) {
                optimizedDeps.push([
                  m.url,
                  m.url.replace(/v=[\w\d]+/, `v=${metadata.browserHash}`)
                ])
                break
              }
            }
          }
          // Apply code changes
          if (optimizedDeps.length) {
            let code = await fs.promises.readFile(entry.fileCode, 'utf8')
            for (const [from, to] of optimizedDeps) {
              code = code.replaceAll(from, to)
            }
            await fs.promises.writeFile(entry.fileCode, code, 'utf8')
            debugLog(
              `Updated ${
                entry.id
              } with new optimized deps imports: ${optimizedDeps
                .map(([from, to]) => `${from} -> ${to}`)
                .join(', ')}`
            )
          }
        }
      })
    )
  }

  return {
    manifest,
    getKey,
    read,
    write,
    queueManifestWrite,
    updateDepsMetadata
  }
}

async function computeCacheVersion(
  config: ResolvedConfig,
  options: ResolvedServerPersistentCacheOptions
): Promise<string> {
  const hashedVersionFiles = await Promise.all(
    options.cacheVersionFromFiles.map((file) => {
      if (!fs.existsSync(file)) {
        throw new Error(`Persistent cache version file not found: ${file}`)
      }
      return fs.promises.readFile(file, 'utf-8')
    })
  ).then((codes) => getCodeHash(codes.join('')))

  const defineHash = config.define
    ? getCodeHash(JSON.stringify(config.define))
    : ''

  const envHash = getCodeHash(JSON.stringify(config.env))

  const cacheVersion = [
    options.cacheVersion,
    `vite:${version}`,
    config.configFileHash,
    hashedVersionFiles,
    defineHash,
    envHash
  ]
    .filter(Boolean)
    .join('-')

  return cacheVersion
}

async function useCacheManifest(
  resolvedCacheDir: string,
  cacheVersion: string,
  logger: Logger
) {
  const manifestPath = path.join(resolvedCacheDir, 'manifest.json')
  let manifest: PersistentCacheManifest | null = null
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      if (manifest && manifest.version !== cacheVersion) {
        // Bust cache if version changed
        debugLog(
          `Clearing persistent cache (${cacheVersion} from ${manifest.version})...`
        )
        try {
          // Empty the directory
          const files = await fs.promises.readdir(resolvedCacheDir)
          await Promise.all(
            files.map((file) =>
              fs.promises.unlink(path.join(resolvedCacheDir, file))
            )
          )
          logger.info(`Deleted ${files.length} files.`)
        } catch (e) {
          logger.warn(
            colors.yellow(
              `Failed to empty persistent cache directory '${resolvedCacheDir}': ${e.message}`
            )
          )
        }
        manifest = null
      }
    } catch (e) {
      logger.warn(
        colors.yellow(
          `Failed to load persistent cache manifest '${manifestPath}': ${e.message}`
        )
      )
    }
  }
  const resolvedManifest: PersistentCacheManifest = manifest ?? {
    version: cacheVersion,
    modules: {},
    files: {}
  }

  // Manifest write queue

  let isManifestWriteQueued = false
  let isManifestWriting = false
  let manifestWriteTimer: any = null

  function queueManifestWrite() {
    if (isManifestWriteQueued) {
      return
    }
    isManifestWriteQueued = true
    if (isManifestWriting) {
      return
    }

    writeManifest()
  }

  function writeManifest() {
    clearTimeout(manifestWriteTimer)
    manifestWriteTimer = setTimeout(async () => {
      isManifestWriting = true
      try {
        await fs.promises.writeFile(
          manifestPath,
          JSON.stringify(resolvedManifest, null, 2)
        )
        debugLog(`Persistent cache manifest saved`)
      } catch (e) {
        logger.warn(
          colors.yellow(
            `Failed to write persistent cache manifest '${manifestPath}': ${e.message}`
          )
        )
      }
      isManifestWriting = false

      if (isManifestWriteQueued) {
        isManifestWriteQueued = false
        writeManifest()
      }
    }, 1000)
  }

  return {
    manifest: resolvedManifest,
    queueManifestWrite
  }
}

interface ResolveServerPersistentCacheConfigPayload {
  config: InlineConfig
  cacheDir: string
  resolvedRoot: string
}

export function resolvePersistentCacheOptions(
  payload: ResolveServerPersistentCacheConfigPayload
): ResolvedServerPersistentCacheOptions | null {
  const { config, resolvedRoot } = payload

  if (
    !config.experimental?.serverPersistentCaching ||
    (typeof config.experimental?.serverPersistentCaching === 'object' &&
      config.experimental.serverPersistentCaching?.enabled === false)
  ) {
    return null
  }

  const castedToObject =
    typeof config.experimental?.serverPersistentCaching === 'object'
      ? config.experimental.serverPersistentCaching
      : null
  const cacheDir = path.join(
    payload.cacheDir,
    castedToObject?.cacheDir ?? `server-cache`
  )

  const cacheVersionFromFiles: string[] = (
    castedToObject?.cacheVersionFromFiles ?? []
  ).map((file) => path.join(resolvedRoot, file))

  const packageLockFile = lookupFile(
    resolvedRoot,
    [
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'bun.lockb',
      'npm-shrinkwrap.json'
    ],
    { pathOnly: true }
  )
  if (packageLockFile) {
    cacheVersionFromFiles.push(packageLockFile)
  }

  const tsconfigFile = lookupFile(resolvedRoot, ['tsconfig.json'], {
    pathOnly: true
  })
  if (tsconfigFile) {
    cacheVersionFromFiles.push(tsconfigFile)
  }

  return {
    cacheDir,
    cacheVersionFromFiles,
    cacheVersion: castedToObject?.cacheVersion ?? '',
    exclude: castedToObject?.exclude
  }
}
