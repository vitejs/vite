import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import colors from 'picocolors'
import { VERSION } from './constants'
import type { Environment } from './environment'
import {
  findLockfilePath,
  findPatchesDir,
  recordsInstalledState,
} from './optimizer'
import { normalizePath } from './utils'

/** The `experimental.cache` option of Rolldown. */
export interface RolldownCacheOptions {
  dir: string
  maxAge?: number
  cacheKey: string
  buildDependencies: string[]
  assumeUnchanged?: string[]
}

export function resolveRolldownCacheOptions(
  environment: Environment,
): RolldownCacheOptions | undefined {
  const config = environment.getTopLevelConfig()
  const userOptions = config.experimental.cache
  if (!userOptions) return
  if (config.configFileDependenciesUnknown) {
    // The files that the config file imports must be build dependencies.
    config.logger.warnOnce(
      colors.yellow(
        "`experimental.cache` is off: Vite cannot find the files that the config file imports with `configLoader: 'native'` on this runtime. Use another `configLoader` to turn the cache on.",
      ),
    )
    return
  }

  const {
    dir,
    maxAge,
    cacheKey,
    buildDependencies = [],
  } = userOptions === true ? {} : userOptions
  const { root } = config
  const lockfilePath = findLockfilePath(root)
  // A patch changes files under node_modules without changing the lockfile.
  const patchesDir = lockfilePath && findPatchesDir(lockfilePath)
  const patchFiles = patchesDir ? listFiles(patchesDir) : []

  const dependencies = new Set<string>()
  for (const file of [
    config.configFile,
    ...config.configFileDependencies,
    lockfilePath,
    ...patchFiles,
    ...buildDependencies,
  ]) {
    if (file) dependencies.add(normalizePath(path.resolve(root, file)))
  }

  const options: RolldownCacheOptions = {
    dir: normalizePath(
      dir
        ? path.resolve(root, dir)
        : path.join(config.cacheDir, 'rolldown-cache'),
    ),
    cacheKey: getConfigCacheKey(environment, cacheKey),
    buildDependencies: [...dependencies],
  }
  if (maxAge !== undefined) options.maxAge = maxAge
  // Safe only when a file that records the installed packages is a build
  // dependency, and module paths are real paths. A lockfile such as
  // `yarn.lock` is still a build dependency: it covers the packages that the
  // config file imports by name, which `configFileDependencies` leaves out.
  if (
    lockfilePath &&
    recordsInstalledState(lockfilePath) &&
    !environment.config.resolve.preserveSymlinks
  ) {
    options.assumeUnchanged = ['**/node_modules/**']
  }
  return options
}

// Runtime state, not config. `webSocketToken` is random in each process.
// `environments` holds the other environments; this one is read through
// the proxy below.
const skippedConfigKeys = new Set([
  'environments',
  'logger',
  'customLogger',
  'packageCache',
  'webSocketToken',
  'safeModulePaths',
  'mainConfig',
])

export function getConfigCacheKey(
  environment: Environment,
  userCacheKey: string | undefined,
): string {
  const config = environment.config
  // `environment.config` is a proxy: the keys of the environment options,
  // then the top-level config for the rest.
  const keys = new Set([
    ...Object.keys(environment.getTopLevelConfig()),
    ...Object.keys(config),
  ])
  const normalizedConfig: Record<string, unknown> = {}
  for (const key of keys) {
    if (skippedConfigKeys.has(key)) continue
    normalizedConfig[key] = config[key as keyof typeof config]
  }
  // `cacheKey` and `buildDependencies` are inputs of their own, and `dir`
  // and `maxAge` do not change results.
  normalizedConfig.experimental = { ...config.experimental, cache: undefined }
  normalizedConfig.inlineConfig = {
    ...config.inlineConfig,
    customLogger: undefined,
    experimental: config.inlineConfig.experimental && {
      ...config.inlineConfig.experimental,
      cache: undefined,
    },
  }

  return hashForCacheKey({
    environment: environment.name,
    config: normalizedConfig,
    // The define plugin reads it when it runs.
    nodeEnv: process.env.NODE_ENV,
    viteVersion: VERSION,
    userCacheKey,
  })
}

// Callbacks into the host never change a result. Like Rolldown's options
// hash, it does not matter whether they are set.
const callbackKeys = new Set(['onLog', 'onwarn', 'onInvalidate'])

/**
 * Hashes a value by the rules of Rolldown's options hash: plain values are
 * hashed, object keys in sorted order, a RegExp by its source and flags, and
 * a function as a fixed tag. Plugins in a `plugins` array add only their
 * names. A class instance that is not a known data type is runtime state and
 * adds only its class name.
 */
export function hashForCacheKey(value: unknown): string {
  const out: string[] = []
  write(value, out, [])
  return crypto.createHash('sha256').update(out.join('')).digest('hex')
}

function write(value: unknown, out: string[], ancestors: object[]): void {
  switch (typeof value) {
    case 'undefined':
      out.push('u')
      return
    case 'boolean':
      out.push(value ? 't' : 'f')
      return
    case 'number':
    case 'bigint':
      out.push(`${typeof value}:${value};`)
      return
    case 'string':
      out.push(JSON.stringify(value))
      return
    case 'symbol':
      out.push('<symbol>')
      return
    case 'function':
      out.push('<function>')
      return
  }
  if (value == null || typeof value !== 'object') {
    out.push('null')
    return
  }

  const cycleIndex = ancestors.indexOf(value)
  if (cycleIndex !== -1) {
    out.push(`<cycle:${ancestors.length - cycleIndex}>`)
    return
  }
  if (value instanceof RegExp) {
    out.push(`regexp:${JSON.stringify(value.source)}${value.flags};`)
    return
  }
  if (value instanceof Date) {
    out.push(`date:${value.getTime()};`)
    return
  }
  if (ArrayBuffer.isView(value)) {
    const bytes = Buffer.from(value.buffer, value.byteOffset, value.byteLength)
    out.push(`bytes:${bytes.toString('base64')};`)
    return
  }
  if (typeof (value as any).then === 'function') {
    out.push('<promise>')
    return
  }

  ancestors.push(value)
  const proto = Object.getPrototypeOf(value)
  if (Array.isArray(value)) {
    out.push('[')
    for (const item of value) {
      write(item, out, ancestors)
      out.push(',')
    }
    out.push(']')
  } else if (proto === Map.prototype || proto === Set.prototype) {
    const entries = [...(value as Map<unknown, unknown> | Set<unknown>)].map(
      (entry) => {
        const entryOut: string[] = []
        write(entry, entryOut, ancestors)
        return entryOut.join('')
      },
    )
    out.push(proto === Map.prototype ? 'map{' : 'set{')
    out.push(entries.sort().join(','), '}')
  } else if (proto === Object.prototype || proto == null) {
    const record = value as Record<string, unknown>
    out.push('{')
    for (const key of Object.keys(record).sort()) {
      const item = record[key]
      if (item === undefined || callbackKeys.has(key)) continue
      out.push(JSON.stringify(key), ':')
      if (key === 'plugins' && Array.isArray(item)) {
        writePlugins(item, out, ancestors)
      } else {
        write(item, out, ancestors)
      }
      out.push(',')
    }
    out.push('}')
  } else {
    out.push(`<instance:${proto?.constructor?.name}>`)
  }
  ancestors.pop()
}

function writePlugins(
  plugins: unknown[],
  out: string[],
  ancestors: object[],
): void {
  out.push('plugins[')
  for (const plugin of plugins.flat(Infinity)) {
    const name =
      plugin && typeof plugin === 'object' && 'name' in plugin
        ? plugin.name
        : undefined
    if (typeof name === 'string') {
      out.push(JSON.stringify(name))
    } else {
      write(plugin, out, ancestors)
    }
    out.push(',')
  }
  out.push(']')
}

function listFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort()
}
