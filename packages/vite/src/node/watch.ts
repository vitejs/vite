import glob from 'fast-glob'
import type { WatchOptions } from 'dep-types/chokidar'
import type { ResolvedConfig } from '.'

export function resolveChokidarOptions(
  config: ResolvedConfig,
  options: WatchOptions | undefined,
): WatchOptions {
  const { ignored = [], ...otherOptions } = options ?? {}

  const resolvedWatchOptions: WatchOptions = {
    ignored: [
      ...[
        '.git/**',
        '.git*',
        '.github/**',
        '.vscode/**',
        '.stackblitz/**',
        'node_modules/**',
        'test-results/**', // Playwright
        'coverage/**',
        '.editorconfig',
        '.eslint*',
        '.prettier*',
        '.npmrc',
        '.yarnrc',
        '*.log',
        '*.cpuprofile',
        'LICENSE',
      ].map((pattern) => '**/' + pattern),
      glob.escapePath(config.cacheDir) + '/**',
      ...(Array.isArray(ignored) ? ignored : [ignored]),
    ],
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ...otherOptions,
  }

  return resolvedWatchOptions
}
