import type {
  ObjectHook,
  MinimalPluginContext as RollupMinimalPluginContext,
  Plugin as RollupPlugin,
} from 'rollup'

export type NonNeverKeys<T> = {
  [K in keyof T]: T[K] extends never ? never : K
}[keyof T]

export type GetHookContextMap<Plugin> = {
  [K in keyof Plugin]-?: Plugin[K] extends ObjectHook<infer T, unknown>
    ? T extends (this: infer This, ...args: any[]) => any
      ? This extends RollupMinimalPluginContext
        ? This
        : never
      : never
    : never
}

type RollupPluginHooksContext = GetHookContextMap<RollupPlugin>
export type RollupPluginHooks = NonNeverKeys<RollupPluginHooksContext>
