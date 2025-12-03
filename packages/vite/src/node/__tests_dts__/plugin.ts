/**
 * This is a development only file for testing types.
 */
import type { Plugin as RolldownPlugin } from 'rolldown'
import type { Equal, ExpectExtends, ExpectTrue } from '@type-challenges/utils'
import type { Plugin as RollupPlugin } from 'rollup'
import type { Plugin, PluginContextExtension, PluginOption } from '../plugin'
import type { ROLLUP_HOOKS } from '../constants'
import type {
  GetHookContextMap,
  NonNeverKeys,
  RollupPluginHooks,
} from '../typeUtils'

type EnvironmentPluginHooksContext = GetHookContextMap<Plugin>
type EnvironmentPluginHooksContextMatched = {
  [K in keyof EnvironmentPluginHooksContext]: EnvironmentPluginHooksContext[K] extends PluginContextExtension
    ? never
    : false
}

type HooksMissingExtension = NonNeverKeys<EnvironmentPluginHooksContextMatched>
type HooksMissingInConstants = Exclude<
  RollupPluginHooks,
  (typeof ROLLUP_HOOKS)[number]
>

export type cases = [
  // Ensure environment plugin hooks are superset of rollup plugin hooks
  ExpectTrue<ExpectExtends<RolldownPlugin, Plugin>>,

  // Ensure all Rollup hooks have Vite's plugin context extension
  ExpectTrue<Equal<HooksMissingExtension, never>>,

  // Ensure the `ROLLUP_HOOKS` constant is up-to-date
  ExpectTrue<Equal<HooksMissingInConstants, never>>,

  // Ensure all Vite plugins, Rolldown plugins, and Rollup plugins can be assigned to `plugins` option
  ExpectTrue<ExpectExtends<PluginOption, RolldownPlugin>>,
  ExpectTrue<ExpectExtends<PluginOption, RollupPlugin>>,
  ExpectTrue<ExpectExtends<PluginOption, Plugin>>,
]

export {}
