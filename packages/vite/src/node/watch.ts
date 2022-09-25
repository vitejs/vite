import path from 'node:path'
import type { WatchOptions } from 'dep-types/chokidar'
import type { ResolvedConfig } from '.'

export function resolveChokidarOptions(
  config: ResolvedConfig,
  options: WatchOptions | undefined
): WatchOptions {
  const { ignored = [], ...otherOptions } = options ?? {}

  const resolvedWatchOptions: WatchOptions = {
    ignored: [
      '**/.git/**',
      '**/node_modules/**',
      '**/test-results/**', // Playwright
      path.relative(config.root, config.cacheDir + '/**'),
      ...(Array.isArray(ignored) ? ignored : [ignored])
    ],
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ...otherOptions
  }

  return resolvedWatchOptions
}
