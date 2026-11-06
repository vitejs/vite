// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { type TracingChannel, tracingChannel } from 'node:diagnostics_channel'

/**
 * Context published on the `vite.plugin` tracing channel.
 * @experimental
 */
export interface PluginTraceContext {
  plugin: string
  hook: 'resolveId' | 'load' | 'transform'
  id: string
  environment: string
}

/**
 * Context published on the `vite.module` tracing channel.
 * @experimental
 */
export interface ModuleTraceContext {
  url: string
  environment: string
}

// `hasSubscribers` is `undefined` in Bun: https://github.com/oven-sh/bun/issues/27805
export const pluginTracingChannel: TracingChannel<unknown, PluginTraceContext> =
  tracingChannel<unknown, PluginTraceContext>('vite.plugin')

export const moduleTracingChannel: TracingChannel<unknown, ModuleTraceContext> =
  tracingChannel<unknown, ModuleTraceContext>('vite.module')

export function tracePluginHook<T>(
  plugin: string,
  hook: PluginTraceContext['hook'],
  id: string,
  environment: string,
  fn: () => T | Promise<T>,
): Promise<T> {
  return pluginTracingChannel.tracePromise(async () => fn(), {
    plugin,
    hook,
    id,
    environment,
  })
}
