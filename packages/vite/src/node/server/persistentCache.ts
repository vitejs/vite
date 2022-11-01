import fs from 'node:fs'
import path from 'node:path'
import colors from 'picocolors'
import type {
  InlineConfig,
  ResolvedConfig,
  ResolvedServerPersistentCacheOptions
} from '../config'
import { normalizePath, version } from '../publicUtils'
import { createDebugger, getCodeHash, isDefined, lookupFile } from '../utils'
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
  importedModules: string[]
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

export async function createPersistentCache(
  config: ResolvedConfig
): Promise<PersistentCache | null> {
  const options = config.serverPersistentCache
  if (!options) {
    return null
  }

  const logger = config.logger
  const debugLog = createDebugger('vite:persistent-cache')

  logger.warn(
    colors.yellow(
      `You have server persistent cache enabled. This is an experimental feature.`
    )
  )

  // Cache directory

  const resolvedCacheDir = normalizePath(path.resolve(options.cacheDir))

  if (!fs.existsSync(resolvedCacheDir)) {
    fs.mkdirSync(resolvedCacheDir, { recursive: true })
  }

  // Cache version

  const hashedVersionFiles = await Promise.all(
    options.cacheVersionFromFiles.map((file) => {
      if (!fs.existsSync(file)) {
        throw new Error(`Persistent cache version file not found: ${file}`)
      }
      return fs.promises.readFile(file, 'utf-8')
    })
  ).then((codes) => getCodeHash(codes.join('')))
  const cacheVersion = `${options.cacheVersion}-${hashedVersionFiles}`

  // Manifest

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

  // Methods

  function getKey(code: string) {
    return getCodeHash(code)
  }

  async function read(key: string): Promise<PersistentCacheResult | null> {
    const entry = resolvedManifest.modules[key]
    if (!entry) {
      return null
    }

    try {
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
      const fileCode = path.resolve(resolvedCacheDir, 'c-' + key)
      const fileMap = map ? fileCode + '-map' : undefined

      await fs.promises.writeFile(fileCode, code, 'utf8')
      if (map && fileMap) {
        await fs.promises.writeFile(fileMap, JSON.stringify(map), 'utf8')
      }

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
          .map((m) => m.url)
          .filter(Boolean) as string[]
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

      resolvedManifest.modules[key] = entry

      queueManifestWrite()
    } catch (e) {
      logger.warn(
        colors.yellow(
          `Failed to write persistent cache entry '${key}' (${file}): ${e.message}`
        )
      )
    }
  }

  return {
    manifest: resolvedManifest,
    getKey,
    read,
    write,
    queueManifestWrite
  }
}

interface ResolveServerPersistentCacheConfigPayload {
  config: InlineConfig
  configFileHash: string | undefined
  cacheDir: string
  resolvedRoot: string
}

export async function resolvePersistentCacheOptions(
  payload: ResolveServerPersistentCacheConfigPayload
): Promise<ResolvedServerPersistentCacheOptions | null> {
  const { config, resolvedRoot, configFileHash } = payload

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
  const cacheDir = path.join(payload.cacheDir, `server-cache`)

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
    cacheVersion: `${castedToObject?.cacheVersion ?? ''}(vite:${version})${
      configFileHash ? `(config:${configFileHash})` : ''
    }`,
    exclude: castedToObject?.exclude
  }
}
