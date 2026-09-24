import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import ignore from 'ignore'
import colors from 'picocolors'
import type { OutputOptions, WatcherOptions } from 'rolldown'
import type { DevWatchOptions } from 'rolldown/experimental'
import { escapePath } from 'tinyglobby'
import type { FSWatcher, WatchOptions } from '#dep-types/chokidar'
import { withTrailingSlash } from '../shared/utils'
import type { Logger } from './logger'
import { arraify, normalizePath } from './utils'

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
  Omit<DevWatchOptions, 'enabled' | 'skipWrite'> & {
    /**
     * Ignore files and directories matched by the patterns in the `.gitignore`
     * at the project root.
     *
     * Only the root `.gitignore` is read. Env files, the config file and its
     * dependencies, and the public directory stay watched even when matched.
     *
     * @default false
     */
    ignoredFromGitignore?: boolean
  }

export function resolveChokidarOptions(
  options: ServerWatchOptions | undefined,
  resolvedOutDirs: Set<string>,
  emptyOutDir: boolean,
  cacheDir: string,
  gitignoreOptions?: {
    root: string
    protectedPaths: string[]
  },
): WatchOptions {
  const {
    ignored: ignoredList,
    ignoredFromGitignore,
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
      ...Array.from(resolvedOutDirs, (outDir) => escapePath(outDir) + '/**'),
    )
  }
  if (ignoredFromGitignore && gitignoreOptions) {
    ignored.push(createGitignoreIgnoreFunction(gitignoreOptions))
  }

  const resolvedWatchOptions: WatchOptions = {
    ignored,
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ...otherOptions,
  }

  return resolvedWatchOptions
}

/**
 * Creates an anymatch-compatible matcher that ignores paths matched by the
 * patterns in the `.gitignore` at the given root. Only the root `.gitignore`
 * is read, matching git's behavior for that single file. Paths outside the
 * root and protected paths (env files, config file dependencies, ...) are
 * never ignored so that the dev server keeps watching the files it needs.
 */
function createGitignoreIgnoreFunction({
  root,
  protectedPaths,
}: {
  root: string
  protectedPaths: string[]
}): (file: string) => boolean {
  const gitignore = ignore()
  const gitignorePath = path.join(root, '.gitignore')
  if (fs.existsSync(gitignorePath)) {
    gitignore.add(fs.readFileSync(gitignorePath, 'utf8'))
  }
  const normalizedProtected = protectedPaths.map((p) => normalizePath(p))
  const protectedFiles = new Set(normalizedProtected)
  const rootWithSlash = withTrailingSlash(normalizePath(root))
  return (file) => {
    const normalizedFile = normalizePath(file)
    if (!normalizedFile.startsWith(rootWithSlash)) {
      return false
    }
    if (
      protectedFiles.has(normalizedFile) ||
      normalizedProtected.some((p) =>
        normalizedFile.startsWith(withTrailingSlash(p)),
      )
    ) {
      return false
    }
    return gitignore.ignores(normalizedFile.slice(rootWithSlash.length))
  }
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
