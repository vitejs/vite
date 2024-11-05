import path from 'node:path'
import type { WatchOptions } from 'dep-types/chokidar'
import picomatch from 'picomatch'
import type { OutputOptions } from 'rollup'
import colors from 'picocolors'
import { escapePath } from 'tinyglobby'
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

export function resolveChokidarOptions(
  options: WatchOptions | null | undefined,
  resolvedOutDirs: Set<string>,
  emptyOutDir: boolean,
  cacheDir: string,
  isRollupChokidar3 = false,
): WatchOptions {
  const { ignored: ignoredList, ...otherOptions } = options ?? {}
  let ignored: WatchOptions['ignored'] = [
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

  if (!isRollupChokidar3) {
    // If watch options is turned off, ignore watching anything, which essentially makes it noop
    // eslint-disable-next-line eqeqeq -- null means disabled
    if (options === null) {
      ignored.push(() => true)
    }
    // Convert strings to picomatch pattern functions for compat
    ignored = ignored.map((pattern) => {
      if (typeof pattern === 'string') {
        const matcher = picomatch(pattern, { dot: true })
        return (path: string) => matcher(path)
      } else {
        return pattern
      }
    })
  }

  const resolvedWatchOptions: WatchOptions = {
    ignored,
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ...otherOptions,
  }

  return resolvedWatchOptions
}
