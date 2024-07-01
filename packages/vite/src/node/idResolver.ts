import type { PartialResolvedId } from 'rollup'
import aliasPlugin from '@rollup/plugin-alias'
import type { ResolvedConfig } from './config'
import type { EnvironmentPluginContainer } from './server/pluginContainer'
import { createEnvironmentPluginContainer } from './server/pluginContainer'
import { resolvePlugin } from './plugins/resolve'
import type { InternalResolveOptions } from './plugins/resolve'
import { getFsUtils } from './fsUtils'
import type { Environment } from './environment'
import type { PartialEnvironment } from './baseEnvironment'

export type ResolveIdFn = (
  environment: PartialEnvironment,
  id: string,
  importer?: string,
  aliasOnly?: boolean,
) => Promise<string | undefined>

/**
 * Create an internal resolver to be used in special scenarios, e.g.
 * optimizer and handling css @imports
 */
export function createIdResolver(
  config: ResolvedConfig,
  options: Partial<InternalResolveOptions>,
): ResolveIdFn {
  const scan = options?.scan

  const pluginContainerMap = new Map<
    PartialEnvironment,
    EnvironmentPluginContainer
  >()
  async function resolve(
    environment: PartialEnvironment,
    id: string,
    importer?: string,
  ): Promise<PartialResolvedId | null> {
    let pluginContainer = pluginContainerMap.get(environment)
    if (!pluginContainer) {
      pluginContainer = await createEnvironmentPluginContainer(
        environment as Environment,
        [
          aliasPlugin({ entries: environment.options.resolve.alias }), // TODO: resolve.alias per environment?
          resolvePlugin({
            root: config.root,
            isProduction: config.isProduction,
            isBuild: config.command === 'build',
            asSrc: true,
            preferRelative: false,
            tryIndex: true,
            ...options,
            fsUtils: getFsUtils(config),
            // Ignore sideEffects and other computations as we only need the id
            idOnly: true,
          }),
        ],
      )
      pluginContainerMap.set(environment, pluginContainer)
    }
    return await pluginContainer.resolveId(id, importer, { scan })
  }

  const aliasOnlyPluginContainerMap = new Map<
    PartialEnvironment,
    EnvironmentPluginContainer
  >()
  async function resolveAlias(
    environment: PartialEnvironment,
    id: string,
    importer?: string,
  ): Promise<PartialResolvedId | null> {
    let pluginContainer = aliasOnlyPluginContainerMap.get(environment)
    if (!pluginContainer) {
      pluginContainer = await createEnvironmentPluginContainer(
        environment as Environment,
        [
          aliasPlugin({ entries: environment.options.resolve.alias }), // TODO: resolve.alias per environment?
        ],
      )
      aliasOnlyPluginContainerMap.set(environment, pluginContainer)
    }
    return await pluginContainer.resolveId(id, importer, { scan })
  }

  return async (environment, id, importer, aliasOnly) => {
    const resolveFn = aliasOnly ? resolveAlias : resolve
    // aliasPlugin and resolvePlugin are implemented to function with a Environment only,
    // we cast it as PluginEnvironment to be able to use the pluginContainer
    const resolved = await resolveFn(environment, id, importer)
    return resolved?.id
  }
}
