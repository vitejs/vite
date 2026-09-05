import aliasPlugin from '@rollup/plugin-alias'
import type { PartialResolvedId } from 'rolldown'
import type { PartialEnvironment } from './baseEnvironment'
import type { ResolvedConfig } from './config'
import type { Environment } from './environment'
import type { Plugin } from './plugin'
import { oxcResolvePlugin } from './plugins/resolve'
import type { InternalResolveOptions } from './plugins/resolve'
import type { EnvironmentPluginContainer } from './server/pluginContainer'
import { createEnvironmentPluginContainer } from './server/pluginContainer'

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

// `@import` inlining needs a file, so a result a plugin marks as external is
// dropped and resolution falls through to the next plugin.
function withoutExternalResults(plugin: Plugin): Plugin {
  const hook = plugin.resolveId!
  const handler = typeof hook === 'object' ? hook.handler : hook
  const wrapped = async function (this: any, ...args: any[]) {
    const result = await (handler as any).apply(this, args)
    return result && typeof result === 'object' && result.external
      ? null
      : result
  }
  return {
    ...plugin,
    resolveId:
      typeof hook === 'object' ? { ...hook, handler: wrapped } : wrapped,
  } as Plugin
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
  const userPrePlugins = options?.userPrePlugins

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
      // Same set of plugins the main pipeline runs before its own resolver
      // (see `resolvePlugins`), so a `resolveId` hook that works for JS
      // imports also works here.
      const prePlugins = userPrePlugins
        ? environment.config.plugins
            .filter(
              (plugin) =>
                plugin.resolveId &&
                (plugin.enforce === 'pre' ||
                  (typeof plugin.resolveId === 'object' &&
                    plugin.resolveId.order === 'pre')),
            )
            .map(withoutExternalResults)
        : []
      pluginContainer = await createEnvironmentPluginContainer(
        environment as Environment,
        [
          // @ts-expect-error  the aliasPlugin uses rollup types
          aliasPlugin({ entries: environment.config.resolve.alias }),
          ...prePlugins,
          ...oxcResolvePlugin(
            {
              root: config.root,
              isProduction: config.isProduction,
              isBuild: config.command === 'build',
              asSrc: true,
              preferRelative: false,
              tryIndex: true,
              ...options,
              // Ignore sideEffects and other computations as we only need the id
              idOnly: true,
            },
            environment.config,
            true,
          ),
        ],
        undefined,
        false,
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
        // @ts-expect-error  the aliasPlugin uses rollup types
        [aliasPlugin({ entries: environment.config.resolve.alias })],
        undefined,
        false,
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
