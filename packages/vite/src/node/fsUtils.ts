import fs from 'node:fs'
// import fsp from 'node:fs/promises'
import path from 'node:path'
import colors from 'picocolors'
import type { ResolvedConfig } from './config'
import { normalizePath, safeRealpathSync, tryStatSync } from './utils'

export interface FsUtils {
  existsSync: (path: string) => boolean
  tryResolveRealFile: (
    path: string,
    preserveSymlinks?: boolean,
  ) => string | undefined
  tryResolveRealFileOrType: (
    path: string,
    preserveSymlinks?: boolean,
  ) => { path?: string; type: 'directory' | 'file' } | undefined
  isDirectory: (path: string) => boolean

  onFileAdd?: (file: string) => void
  onFileUnlink?: (file: string) => void
  onDirectoryAdd?: (file: string) => void
  onDirectoryUnlink?: (file: string) => void
}

// An implementation of fsUtils without caching
export const commonFsUtils: FsUtils = {
  existsSync: fs.existsSync,
  tryResolveRealFile,
  tryResolveRealFileOrType,
  isDirectory,
}

const cachedFsUtilsMap = new WeakMap<ResolvedConfig, FsUtils>()
export function getFsUtils(config: ResolvedConfig): FsUtils {
  let fsUtils = cachedFsUtilsMap.get(config)
  if (!fsUtils) {
    if (config.command !== 'serve' || !config.server.fs.cachedChecks) {
      // cached fsUtils is only used in the dev server for now, and only when the watcher isn't configured
      // we can support custom ignored patterns later
      fsUtils = commonFsUtils
    } else if (config.server.watch === null || config.server.watch?.ignored) {
      config.logger.warn(
        colors.yellow(
          `${colors.bold(
            `(!)`,
          )} server.fs.cachedChecks isn't supported if server.watch is null or a custom server.watch.ignored is configured\n`,
        ),
      )
      fsUtils = commonFsUtils
    } else {
      fsUtils = createCachedFsUtils(config)
    }
    cachedFsUtilsMap.set(config, fsUtils)
  }
  return fsUtils
}

type DirentsMap = Map<string, DirentCache>

type DirentCacheType = 'directory' | 'file' | 'symlink' | 'error'

interface DirentCache {
  dirents?: DirentsMap | Promise<DirentsMap>
  type: DirentCacheType
}

function readDirCacheSync(file: string): undefined | DirentsMap {
  let dirents: fs.Dirent[]
  try {
    dirents = fs.readdirSync(file, { withFileTypes: true })
  } catch {
    return
  }
  return direntsToDirentMap(dirents)
}

function direntsToDirentMap(fsDirents: fs.Dirent[]): DirentsMap {
  const dirents = new Map<string, DirentCache>()
  for (const dirent of fsDirents) {
    // We ignore non directory, file, and symlink entries
    const type = dirent.isDirectory()
      ? 'directory'
      : dirent.isSymbolicLink()
        ? 'symlink'
        : dirent.isFile()
          ? 'file'
          : undefined
    if (type) {
      dirents.set(dirent.name, { type })
    }
  }
  return dirents
}

export function createCachedFsUtils(config: ResolvedConfig): FsUtils {
  const { root } = config
  const rootDirPath = `${root}/`
  const rootCache = { type: 'directory' as DirentCacheType } // dirents will be computed lazily
  if (!rootCache) {
    return commonFsUtils
  }

  const getDirentCacheSync = (parts: string[]): DirentCache | undefined => {
    let direntCache: DirentCache = rootCache
    for (let i = 0; i < parts.length; i++) {
      if (direntCache.type === 'directory') {
        if (!direntCache.dirents || direntCache.dirents instanceof Promise) {
          const dirPath = path.posix.join(root, ...parts.slice(0, i))
          const dirents = readDirCacheSync(dirPath)
          if (!dirents) {
            direntCache.type = 'error'
            return
          }
          direntCache.dirents = dirents
        }
        const nextDirentCache = direntCache.dirents.get(parts[i])
        if (!nextDirentCache) {
          return
        }
        direntCache = nextDirentCache
      } else if (direntCache.type === 'symlink') {
        // early return if we encounter a symlink
        return direntCache
      } else if (direntCache.type === 'error') {
        return direntCache
      } else if (direntCache.type === 'file') {
        return i === parts.length - 1 ? direntCache : undefined
      }
    }
    return direntCache
  }

  function getDirentCacheFromPath(
    file: string,
  ): DirentCache | false | undefined {
    const normalizedFile = normalizePath(file)
    if (normalizedFile === root) {
      return rootCache
    }
    if (
      !normalizedFile.startsWith(rootDirPath) ||
      normalizedFile.includes('/node_modules/')
    ) {
      return undefined
    }
    const pathFromRoot = normalizedFile.slice(rootDirPath.length)
    const parts = pathFromRoot.split('/')
    const direntCache = getDirentCacheSync(parts)
    if (!direntCache || direntCache.type === 'error') {
      return false
    }
    return direntCache
  }

  function onPathAdd(file: string): void {
    const direntCache = getDirentCacheFromPath(path.dirname(file))
    if (direntCache && direntCache.type === 'directory') {
      // We don't know if the file is a symlink or not for the stats
      // in the chokidar callback, so we delete the direntCache for the
      // parent directory and let the next call to fsUtils recreate it
      direntCache.dirents = undefined
    }
  }

  async function onPathUnlink(file: string): Promise<void> {
    const direntCache = getDirentCacheFromPath(path.dirname(file))
    if (direntCache && direntCache.type === 'directory') {
      if (direntCache.dirents) {
        const dirents = await direntCache.dirents
        dirents.delete(path.basename(file))
      }
    }
  }

  return {
    existsSync(file: string) {
      const direntCache = getDirentCacheFromPath(file)
      if (
        direntCache === undefined ||
        (direntCache && direntCache.type === 'symlink')
      ) {
        // fallback to built-in fs for out-of-root and symlinked files
        return fs.existsSync(file)
      }
      return !!direntCache
    },
    tryResolveRealFile(
      file: string,
      preserveSymlinks?: boolean,
    ): string | undefined {
      const direntCache = getDirentCacheFromPath(file)
      if (
        direntCache === undefined ||
        (direntCache && direntCache.type === 'symlink')
      ) {
        // fallback to built-in fs for out-of-root and symlinked files
        return tryResolveRealFile(file, preserveSymlinks)
      }
      if (!direntCache || direntCache.type === 'directory') {
        return
      }
      // We can avoid getRealPath even if preserveSymlinks is false because we know it's
      // a file without symlinks in its path
      return normalizePath(file)
    },
    tryResolveRealFileOrType(
      file: string,
      preserveSymlinks?: boolean,
    ): { path?: string; type: 'directory' | 'file' } | undefined {
      const direntCache = getDirentCacheFromPath(file)
      if (
        direntCache === undefined ||
        (direntCache && direntCache.type === 'symlink')
      ) {
        // fallback to built-in fs for out-of-root and symlinked files
        return tryResolveRealFileOrType(file, preserveSymlinks)
      }
      if (!direntCache) {
        return
      }
      if (direntCache.type === 'directory') {
        return { type: 'directory' }
      }
      // We can avoid getRealPath even if preserveSymlinks is false because we know it's
      // a file without symlinks in its path
      return { path: normalizePath(file), type: 'file' }
    },
    isDirectory(path: string) {
      const direntCache = getDirentCacheFromPath(path)
      if (
        direntCache === undefined ||
        (direntCache && direntCache.type === 'symlink')
      ) {
        // fallback to built-in fs for out-of-root and symlinked files
        return isDirectory(path)
      }
      return direntCache && direntCache.type === 'directory'
    },

    onFileAdd: onPathAdd,
    onFileUnlink: onPathUnlink,
    onDirectoryAdd: onPathAdd,
    onDirectoryUnlink: onPathUnlink,
  }
}

function tryResolveRealFile(
  file: string,
  preserveSymlinks?: boolean,
): string | undefined {
  const stat = tryStatSync(file)
  if (stat?.isFile()) return getRealPath(file, preserveSymlinks)
}

function tryResolveRealFileOrType(
  file: string,
  preserveSymlinks?: boolean,
): { path?: string; type: 'directory' | 'file' } | undefined {
  const fileStat = tryStatSync(file)
  if (fileStat?.isFile()) {
    return { path: getRealPath(file, preserveSymlinks), type: 'file' }
  }
  if (fileStat?.isDirectory()) {
    return { type: 'directory' }
  }
  return
}

function getRealPath(resolved: string, preserveSymlinks?: boolean): string {
  if (!preserveSymlinks) {
    resolved = safeRealpathSync(resolved)
  }
  return normalizePath(resolved)
}

function isDirectory(path: string): boolean {
  const stat = tryStatSync(path)
  return stat?.isDirectory() ?? false
}
