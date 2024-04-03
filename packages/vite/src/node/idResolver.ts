import type { PartialResolvedId } from 'rollup'
import aliasPlugin from '@rollup/plugin-alias'
import type { ResolvedConfig } from './config'
import type { Environment } from './environment'
import type { PluginEnvironment } from './plugin'
import type { PluginContainer } from './server/pluginContainer'
import { resolvePlugin } from './plugins/resolve'
import type { InternalResolveOptions } from './plugins/resolve'
import { getFsUtils } from './fsUtils'
import { createPluginContainer } from './server/pluginContainer'

export type ResolveIdFn = (
  environment: Environment,
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

  let pluginContainer: PluginContainer | undefined
  async function resolve(
    environment: PluginEnvironment,
    id: string,
    importer?: string,
  ): Promise<PartialResolvedId | null> {
    pluginContainer ??= await createPluginContainer({
      ...config,
      plugins: [
        aliasPlugin({ entries: config.resolve.alias }), // TODO: resolve.alias per environment?
        resolvePlugin(
          {
            root: config.root,
            isProduction: config.isProduction,
            isBuild: config.command === 'build',
            ssrConfig: config.ssr,
            asSrc: true,
            preferRelative: false,
            tryIndex: true,
            ...options,
            fsUtils: getFsUtils(config),
            // Ignore sideEffects and other computations as we only need the id
            idOnly: true,
          },
          config.environments,
        ),
      ],
    })
    return await pluginContainer.resolveId(id, importer, { environment, scan })
  }

  let aliasOnlyPluginContainer: PluginContainer | undefined
  async function resolveAlias(
    environment: PluginEnvironment,
    id: string,
    importer?: string,
  ): Promise<PartialResolvedId | null> {
    aliasOnlyPluginContainer ??= await createPluginContainer({
      ...config,
      plugins: [
        aliasPlugin({ entries: config.resolve.alias }), // TODO: resolve.alias per environment?
      ],
    })
    return await aliasOnlyPluginContainer.resolveId(id, importer, {
      environment,
      scan,
    })
  }

  return async (environment, id, importer, aliasOnly) => {
    const resolveFn = aliasOnly ? resolveAlias : resolve
    // aliasPlugin and resolvePlugin are implemented to function with a Environment only,
    // we cast it as PluginEnvironment to be able to use the pluginContainer
    const resolved = await resolveFn(
      environment as PluginEnvironment,
      id,
      importer,
    )
    return resolved?.id
  }
}
