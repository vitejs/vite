import path from 'node:path'
import fs from 'node:fs'
import { normalizePath } from 'vite'
import type { Options, ResolvedOptions } from './types.js'
import { lookupFile } from './utils.js'

interface ResolveServerCacheConfigPayload {
  pluginOptions: Options
  cacheDir: string
  root: string
}

export function resolveOptions(
  payload: ResolveServerCacheConfigPayload,
): ResolvedOptions {
  const { pluginOptions, root } = payload

  const cacheDir = normalizePath(
    path.resolve(payload.cacheDir, pluginOptions.cacheDir ?? `server-cache`),
  )

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }

  const cacheVersionFromFiles: string[] = (
    pluginOptions.cacheVersionFromFiles ?? []
  ).map((file) => path.join(root, file))

  const packageLockFile = lookupFile(root, [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bun.lockb',
    'npm-shrinkwrap.json',
  ])
  if (packageLockFile) {
    cacheVersionFromFiles.push(packageLockFile)
  }

  const tsconfigFile = lookupFile(root, ['tsconfig.json'])
  if (tsconfigFile) {
    cacheVersionFromFiles.push(tsconfigFile)
  }

  return {
    cacheDir,
    cacheVersionFromFiles,
    cacheVersion: pluginOptions.cacheVersion ?? '',
    exclude: pluginOptions.exclude,
  }
}
