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
 * Some projects like Astro were overriding config.createResolver to add a custom
 * alias plugin. For the client and ssr environments, we root through it to avoid
 * breaking changes for now.
 */
export function createBackCompatIdResolver(
  config: ResolvedConfig,
  options?: Partial<InternalResolveOptions>,
): ResolveIdFn {
  const compatResolve = config.createResolver(options)
  let resolve: ResolveIdFn
  return async (environment, id, importer, aliasOnly) => {
    if (environment.name === 'client' || environment.name === 'ssr') {
      return compatResolve(id, importer, aliasOnly, environment.name === 'ssr')
    }
    resolve ??= createIdResolver(config, options)
    return resolve(environment, id, importer, aliasOnly)
  }
}

/**
 * Create an internal resolver to be used in special scenarios, e.g.
 * optimizer and handling css @imports
 */
export function createIdResolver(
  config: ResolvedConfig,
  options?: Partial<InternalResolveOptions>,
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
          aliasPlugin({ entries: environment.config.resolve.alias }),
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
        [aliasPlugin({ entries: environment.config.resolve.alias })],
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
