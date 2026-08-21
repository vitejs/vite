import { EventEmitter } from 'node:events'
import path from 'node:path'
import type { OutputOptions, WatcherOptions } from 'rolldown'
import type { DevWatchOptions } from 'rolldown/experimental'
import colors from 'picocolors'
import { escapePath } from 'tinyglobby'
import type { FSWatcher, WatchOptions } from '#dep-types/chokidar'
import { withTrailingSlash } from '../shared/utils'
import { arraify, normalizePath } from './utils'
import type { Logger } from './logger'

export function getResolvedOutDirs(
  root: string,
  outDir: string,
  outputOptions: OutputOptions[] | OutputOptions | undefined,
): Set<string> {
  const resolvedOutDir = path.resolve(root, outDir)
  if (!outputOptions) return new Set([resolvedOutDir])

  return new Set(
    arraify(outputOptions).map(({ dir }) =>
      dir ? path.resolve(root, dir) : resolvedOutDir,
    ),
  )
}

export function resolveEmptyOutDir(
  emptyOutDir: boolean | null,
  root: string,
  outDirs: Set<string>,
  logger?: Logger,
): boolean {
  if (emptyOutDir != null) return emptyOutDir

  for (const outDir of outDirs) {
    if (!normalizePath(outDir).startsWith(withTrailingSlash(root))) {
      // warn if outDir is outside of root
      logger?.warn(
        colors.yellow(
          `\n${colors.bold(`(!)`)} outDir ${colors.white(
            colors.dim(outDir),
          )} is not inside project root and will not be emptied.\n` +
            `Use --emptyOutDir to override.\n`,
        ),
      )
      return false
    }
  }
  return true
}

/**
 * Watch options for the dev server. Accepts both chokidar options and Rolldown
 * watch options. The chokidar options are used by the chokidar watcher, while
 * the Rolldown options are used by the Rolldown file watcher when bundled dev
 * mode is enabled.
 */
export type ServerWatchOptions = WatchOptions &
  Omit<DevWatchOptions, 'enabled' | 'skipWrite'>

export function resolveChokidarOptions(
  options: ServerWatchOptions | undefined,
  resolvedOutDirs: Set<string>,
  emptyOutDir: boolean,
  cacheDir: string,
): WatchOptions {
  const {
    ignored: ignoredList,
    pollInterval,
    useDebounce,
    debounceDuration,
    debounceTickRate,
    compareContentsForPolling,
    include,
    exclude,
    ...otherOptions
  } = options ?? {}
  const ignored: WatchOptions['ignored'] = [
    '**/.git/**',
    '**/node_modules/**',
    '**/test-results/**', // Playwright
    escapePath(cacheDir) + '/**',
    ...arraify(ignoredList || []),
  ]
  if (emptyOutDir) {
    ignored.push(
      ...[...resolvedOutDirs].map((outDir) => escapePath(outDir) + '/**'),
    )
  }

  const resolvedWatchOptions: WatchOptions = {
    ignored,
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ...otherOptions,
  }

  return resolvedWatchOptions
}

export function convertToWatcherOptions(
  options: WatchOptions | undefined,
): WatcherOptions['watcher'] {
  if (!options) return

  return {
    usePolling: options.usePolling,
    pollInterval: options.interval,
  }
}

export function convertToDevWatchOptions(
  options: ServerWatchOptions | null | undefined,
): DevWatchOptions {
  // eslint-disable-next-line eqeqeq
  if (options === null) return { enabled: false }
  if (!options) return {}

  return {
    usePolling: options.usePolling,
    pollInterval: options.pollInterval ?? options.interval,
    useDebounce: options.useDebounce,
    debounceDuration: options.debounceDuration,
    debounceTickRate: options.debounceTickRate,
    compareContentsForPolling: options.compareContentsForPolling,
    include: options.include,
    exclude: options.exclude,
  }
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
