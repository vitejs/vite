import { resolveConfig } from '../config'
import { createRunnableDevEnvironment } from '../server/environments/runnableEnvironment'

interface InlineImportResult {
  module: any
  dependencies: string[]
}

export async function inlineImport(
  moduleId: string,
): Promise<InlineImportResult> {
  const environment = createRunnableDevEnvironment(
    'inline',
    // TODO: provide a dummy config?
    await resolveConfig(
      {
        configFile: false,
        environments: {
          inline: {
            consumer: 'server',
            dev: {
              moduleRunnerTransform: true,
            },
            resolve: {
              external: true,
            },
          },
        },
      },
      'serve',
    ),
    {
      runnerOptions: {
        hmr: {
          logger: false,
        },
      },
      hot: false,
    },
  )
  await environment.init()
  try {
    const module = await environment.runner.import(moduleId)
    const modules = [
      ...environment.runner.evaluatedModules.fileToModulesMap.entries(),
    ]
    const dependencies = modules
      .filter(([file, modules]) => {
        const isExternal = [...modules].every(
          (m) => !m.meta || 'externalize' in m.meta,
        )
        return !isExternal && file !== moduleId
      })
      .map(([file]) => file)
    return {
      module,
      dependencies,
    }
  } finally {
    await environment.close()
  }
}
