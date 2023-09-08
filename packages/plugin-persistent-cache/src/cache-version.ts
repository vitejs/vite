import fs from 'node:fs'
import { type ResolvedConfig, version } from 'vite'
import type { ResolvedOptions } from './types.js'
import { getCodeHash } from './utils.js'

export async function computeCacheVersion(
  options: ResolvedOptions,
  config: ResolvedConfig,
): Promise<string> {
  const hashedVersionFiles = await Promise.all(
    options.cacheVersionFromFiles.map((file) => {
      if (!fs.existsSync(file)) {
        throw new Error(`Persistent cache version file not found: ${file}`)
      }
      return fs.promises.readFile(file, 'utf-8')
    }),
  ).then((codes) => getCodeHash(codes.join('')))

  const defineHash = config.define
    ? getCodeHash(JSON.stringify(config.define))
    : ''

  const envHash = getCodeHash(JSON.stringify(config.env))

  let configFileHash: string | undefined
  if (config.configFile) {
    const code = fs.readFileSync(config.configFile, 'utf-8')
    configFileHash = getCodeHash(code)
  }

  const cacheVersion = [
    options.cacheVersion,
    `vite:${version}`,
    configFileHash,
    hashedVersionFiles,
    defineHash,
    envHash,
  ]
    .filter(Boolean)
    .join('-')

  return cacheVersion
}
