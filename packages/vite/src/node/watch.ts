import type { WatchOptions } from 'types/chokidar'
import colors from 'picocolors'
import type { Logger } from './logger'
import { isWSL2 } from './utils'

export function resolveChokidarOptions(
  logger: Logger,
  options: WatchOptions | undefined,
  optionName: string
): WatchOptions {
  const { ignored = [], ...otherOptions } = options ?? {}

  const resolvedWatchOptions: WatchOptions = {
    ignored: [
      '**/.git/**',
      '**/node_modules/**',
      '**/test-results/**', // Playwright
      ...(Array.isArray(ignored) ? ignored : [ignored])
    ],
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ...otherOptions
  }

  if (isWSL2 && resolvedWatchOptions.usePolling === undefined) {
    logger.warn(
      colors.yellow(
        colors.bold(`(!) `) +
          'Default file system watching might not work with your setup due to the limitation of WSL2. ' +
          'HMR and other features will not work when file system watching is not working. ' +
          `To suppress this warning, set true or false to "${optionName}.usePolling". ` +
          'More information: https://vitejs.dev/config/server-options.html#server-watch'
      )
    )
  }

  return resolvedWatchOptions
}
