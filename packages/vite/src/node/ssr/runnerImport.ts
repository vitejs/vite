import type { InlineConfig } from '../config'
import { resolveConfig } from '../config'
import { createRunnableDevEnvironment } from '../server/environments/runnableEnvironment'
import { mergeConfig } from '../utils'

interface RunnerImportResult<T> {
  module: T
  dependencies: string[]
}

/**
 * Import any file using the default Vite environment.
 * @experimental
 */
export async function runnerImport<T>(
  moduleId: string,
  inlineConfig?: InlineConfig,
): Promise<RunnerImportResult<T>> {
  const isModuleSyncConditionEnabled = (await import('#module-sync-enabled'))
    .default
  const nodeEnv = process.env.NODE_ENV
  const config = await resolveConfig(
    mergeConfig(inlineConfig || {}, {
      configFile: false,
      envDir: false,
      cacheDir: process.cwd(),
      environments: {
        inline: {
          consumer: 'server',
          dev: {
            moduleRunnerTransform: true,
          },
          resolve: {
            external: true,
            mainFields: [],
            conditions: [
              'node',
              ...(isModuleSyncConditionEnabled ? ['module-sync'] : []),
            ],
          },
        },
      },
    } satisfies InlineConfig),
    'serve',
  ).finally(() => {
    // `resolveConfig` defaults an unset `NODE_ENV` for the dev server and the
    // build. Importing a file shouldn't leave that default on the process.
    if (!nodeEnv && process.env.NODE_ENV === 'development') {
      if (nodeEnv === undefined) {
        delete process.env.NODE_ENV
      } else {
        process.env.NODE_ENV = nodeEnv
      }
    }
  })
  const environment = createRunnableDevEnvironment('inline', config, {
    runnerOptions: {
      hmr: {
        logger: false,
      },
    },
    hot: false,
  })
  await environment.init()
  try {
    const module = await environment.runner.import(moduleId)
    const modules = [
      ...environment.runner.evaluatedModules.urlToIdModuleMap.values(),
    ]
    const dependencies = modules
      .filter((m) => {
        // ignore all externalized modules
        if (!m.meta || 'externalize' in m.meta) {
          return false
        }
        // ignore the current module
        return m.exports !== module
      })
      .map((m) => m.file)
    return {
      module,
      dependencies,
    }
  } finally {
    await environment.close()
  }
}
