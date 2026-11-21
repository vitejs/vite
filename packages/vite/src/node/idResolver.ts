import aliasPlugin from '@rollup/plugin-alias'
import type { PartialResolvedId } from 'rolldown'
import { BaseEnvironment } from './baseEnvironment'
import type { PartialEnvironment } from './baseEnvironment'
import type { ResolveFn, ResolvedConfig } from './config'
import type { Environment } from './environment'
import type { HookHandler, Plugin } from './plugin'
import { getUserPreResolvePlugins } from './plugin'
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
  let compatResolve = options?.userPrePlugins
    ? undefined
    : config.createResolver(options)
  const compatResolvers = new WeakMap<PartialEnvironment, ResolveFn>()
  let resolve: ResolveIdFn
  return async (environment, id, importer, aliasOnly) => {
    if (environment.name === 'client' || environment.name === 'ssr') {
      const ssr = environment.name === 'ssr'
      // Standalone preprocessCSS creates a new PartialEnvironment for each
      // call. Only bind an environment when a user hook can observe it.
      if (
        !options?.userPrePlugins ||
        !(environment instanceof BaseEnvironment) ||
        !getUserPreResolvePlugins(environment.config.plugins)
      ) {
        compatResolve ??= config.createResolver(options)
        return compatResolve(id, importer, aliasOnly, ssr)
      }
      let resolver = compatResolvers.get(environment)
      if (!resolver) {
        // Bind the environment when creating the resolver so existing wrappers
        // can keep forwarding the original four arguments.
        resolver = config.createResolver({ ...options, environment })
        compatResolvers.set(environment, resolver)
      }
      return resolver(id, importer, aliasOnly, ssr)
    }
    resolve ??= createIdResolver(config, options)
    return resolve(environment, id, importer, aliasOnly)
  }
}

function toCssResolvePlugin(plugin: Plugin): Plugin {
  const hook = plugin.resolveId!
  const handler = typeof hook === 'object' ? hook.handler : hook
  const wrapped: HookHandler<NonNullable<Plugin['resolveId']>> =
    async function (...args) {
      const result = await handler.apply(this, args)
      if (!result) return result
      if (typeof result === 'object' && result.external) return null
      // CSS reads the file directly. Let the next resolver try the original
      // import when a plugin returns a virtual or query-bearing module ID.
      const id = typeof result === 'string' ? result : result.id
      if (id.includes('\0') || id.startsWith('virtual:') || id.includes('?')) {
        return null
      }
      return result
    }
  return {
    // This container only resolves files. Lifecycle hooks belong to the main
    // pipeline and must not run again when a CSS resolver is created.
    name: plugin.name,
    resolveId:
      typeof hook === 'object' ? { ...hook, handler: wrapped } : wrapped,
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
      const prePlugins = userPrePlugins
        ? (getUserPreResolvePlugins(environment.config.plugins)?.map(
            toCssResolvePlugin,
          ) ?? [])
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
