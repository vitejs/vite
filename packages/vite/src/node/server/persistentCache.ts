import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import colors from 'picocolors'
import type {
  InlineConfig,
  ResolvedConfig,
  ResolvedServerPersistentCacheOptions
} from '../config'
import { normalizePath, version } from '../publicUtils'
import { lookupFile } from '../utils'

export interface PersistentCache {
  manifest: PersistentCacheManifest
  getKey: (code: string) => string
  read: (key: string) => Promise<PersistentCacheResult | null>
  write: (key: string, file: string, code: string, map?: any) => Promise<void>
  queueManifestWrite: () => void
}

export interface PersistentCacheManifest {
  version: string
  modules: Record<string, PersistentCacheEntry>
  files: Record<string, PersistentCacheFile>
}

export interface PersistentCacheEntry {
  file: string
  fileCode: string
  fileMap?: string
}

export interface PersistentCacheResult {
  code: string
  map?: any
}

export interface PersistentCacheFile {
  relatedModules: Record<string, string>
}

function hashCode(code: string) {
  return crypto.createHash('sha1').update(code).digest('hex')
}

export async function createPersistentCache(
  config: ResolvedConfig
): Promise<PersistentCache | null> {
  const options = config.resolvedServerPersistentCacheOptions
  if (!options) {
    return null
  }

  const logger = config.logger

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
  ).then((codes) => hashCode(codes.join('')))
  const cacheVersion = `${options.cacheVersion}-${hashedVersionFiles}`

  // Manifest

  const manifestPath = path.join(resolvedCacheDir, 'manifest.json')
  let manifest: PersistentCacheManifest | null = null
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf-8'))
      if (manifest && manifest.version !== cacheVersion) {
        // Bust cache if version changed
        logger.info(
          colors.blue(
            `Clearing persistent cache (${cacheVersion} from ${manifest.version})...`
          )
        )
        try {
          // Empty the directory
          const files = await fs.promises.readdir(resolvedCacheDir)
          await Promise.all(
            files.map((file) =>
              fs.promises.unlink(path.join(resolvedCacheDir, file))
            )
          )
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

  function queueManifestWrite() {
    if (isManifestWriteQueued) {
      return
    }

    if (isManifestWriting) {
      isManifestWriteQueued = true
      return
    }

    setTimeout(async () => {
      isManifestWriting = true
      try {
        await fs.promises.writeFile(
          manifestPath,
          JSON.stringify(resolvedManifest, null, 2)
        )
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
        queueManifestWrite()
      }
    }, 500)
  }

  // Methods

  function getKey(code: string) {
    return hashCode(code)
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

  async function write(key: string, file: string, code: string, map?: any) {
    try {
      const fileCode = path.resolve(resolvedCacheDir, 'c-' + key)
      const fileMap = map ? fileCode + '-map' : undefined

      await fs.promises.writeFile(fileCode, code, 'utf8')
      if (map && fileMap) {
        await fs.promises.writeFile(fileMap, JSON.stringify(map), 'utf8')
      }

      resolvedManifest.modules[key] = {
        file,
        fileCode,
        fileMap
      }

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
  pkgPath: string | undefined
  resolvedRoot: string
  resolvedConfigFile: string | undefined
}

export async function resolvePersistentCacheOptions(
  payload: ResolveServerPersistentCacheConfigPayload
): Promise<ResolvedServerPersistentCacheOptions | null> {
  const { config, resolvedRoot, pkgPath, resolvedConfigFile } = payload

  let resolvedServerPersistentCacheOptions: ResolvedServerPersistentCacheOptions | null
  if (
    config.experimental?.serverPersistentCaching != null &&
    (config.experimental?.serverPersistentCaching !== false ||
      (typeof config.experimental?.serverPersistentCaching === 'object' &&
        config.experimental.serverPersistentCaching.enabled !== false))
  ) {
    const castedToObject =
      typeof config.experimental?.serverPersistentCaching === 'object'
        ? config.experimental.serverPersistentCaching
        : null
    const dir = castedToObject?.cacheDir
      ? path.resolve(resolvedRoot, castedToObject.cacheDir)
      : pkgPath
      ? path.join(path.dirname(pkgPath), `node_modules/.vite-server-cache`)
      : path.join(resolvedRoot, `.vite-server-cache`)

    const cacheVersionFromFiles: string[] = (
      castedToObject?.cacheVersionFromFiles ?? []
    ).map((file) => path.join(resolvedRoot, file))

    if (resolvedConfigFile) {
      cacheVersionFromFiles.push(resolvedConfigFile)
    }

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

    resolvedServerPersistentCacheOptions = {
      cacheDir: dir,
      cacheVersionFromFiles,
      cacheVersion: castedToObject?.cacheVersion ?? '',
      exclude: castedToObject?.exclude
    }
    // Add vite version
    resolvedServerPersistentCacheOptions.cacheVersion += `(vite:${version})`
  } else {
    resolvedServerPersistentCacheOptions = null
  }

  return resolvedServerPersistentCacheOptions
}
