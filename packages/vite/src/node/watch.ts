import { EventEmitter } from 'node:events'
import path from 'node:path'
import glob from 'fast-glob'
import type { FSWatcher, WatchOptions } from 'dep-types/chokidar'
import { arraify } from './utils'
import type { ResolvedConfig } from '.'

export function resolveChokidarOptions(
  config: ResolvedConfig,
  options: WatchOptions | undefined,
): WatchOptions {
  const { ignored = [], ...otherOptions } = options ?? {}

  const resolvedWatchOptions: WatchOptions = {
    ignored: [
      '**/.git/**',
      '**/node_modules/**',
      '**/test-results/**', // Playwright
      glob.escapePath(config.cacheDir) + '/**',
      glob.escapePath(path.resolve(config.root, config.build.outDir)) + '/**',
      ...arraify(ignored),
    ],
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ...otherOptions,
  }

  return resolvedWatchOptions
}

class NoopWatcher extends EventEmitter implements FSWatcher {
  constructor(public options: WatchOptions) {
    super()
  }

  add() {
    return this
  }

  unwatch() {
    return this
  }

  getWatched() {
    return {}
  }

  ref() {
    return this
  }

  unref() {
    return this
  }

  async close() {
    // noop
  }
}

export function createNoopWatcher(options: WatchOptions): FSWatcher {
  return new NoopWatcher(options)
}
