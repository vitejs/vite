import fs from 'node:fs'
import path from 'node:path'
import { cleanUrl, withTrailingSlash } from '../shared/utils'
import type { ResolvedConfig } from './config'
import {
  ERR_SYMLINK_IN_RECURSIVE_READDIR,
  normalizePath,
  recursiveReaddir,
  tryStatSync,
} from './utils'

const publicFilesMap = new WeakMap<ResolvedConfig, Set<string>>()

export async function initPublicFiles(
  config: ResolvedConfig,
): Promise<Set<string> | undefined> {
  // If the configured public dir doesn't exist, don't return an (empty)
  // in-memory cache for it: callers rely on `undefined` here to know the
  // directory isn't there, e.g. so it isn't added to the dev server's file
  // watcher, which would otherwise silently break the watcher entirely.
  // https://github.com/vitejs/vite/issues/19864
  if (!fs.existsSync(config.publicDir)) {
    return
  }
  let fileNames: string[]
  try {
    fileNames = await recursiveReaddir(config.publicDir)
  } catch (e) {
    if (e.code === ERR_SYMLINK_IN_RECURSIVE_READDIR) {
      return
    }
    throw e
  }
  const publicFiles = new Set(
    fileNames.map((fileName) => fileName.slice(config.publicDir.length)),
  )
  publicFilesMap.set(config, publicFiles)
  return publicFiles
}

function getPublicFiles(config: ResolvedConfig): Set<string> | undefined {
  return publicFilesMap.get(config)
}

export function checkPublicFile(
  url: string,
  config: ResolvedConfig,
): string | undefined {
  // note if the file is in /public, the resolver would have returned it
  // as-is so it's not going to be a fully resolved path.
  const { publicDir } = config
  if (!publicDir || url[0] !== '/') {
    return
  }

  const fileName = cleanUrl(url)

  // short-circuit if we have an in-memory publicFiles cache
  const publicFiles = getPublicFiles(config)
  if (publicFiles) {
    return publicFiles.has(fileName)
      ? normalizePath(path.join(publicDir, fileName))
      : undefined
  }

  const publicFile = normalizePath(path.join(publicDir, fileName))
  if (!publicFile.startsWith(withTrailingSlash(publicDir))) {
    // can happen if URL starts with '../'
    return
  }

  return tryStatSync(publicFile)?.isFile() ? publicFile : undefined
}
