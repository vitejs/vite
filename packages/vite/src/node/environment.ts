import type { DevEnvironment } from './server/environment'
import type { BuildEnvironment } from './build'
import type { ScanEnvironment } from './optimizer/scan'
import type { FutureCompatEnvironment } from './baseEnvironment'
import type { PluginContext } from './plugin'

export type Environment =
  | DevEnvironment
  | BuildEnvironment
  | ScanEnvironment
  | FutureCompatEnvironment

/**
 * Creates a function that hides the complexities of a WeakMap with an initial value
 * to implement object metadata. Used by plugins to implement cross hooks per
 * environment metadata
 */
export function usePerEnvironmentState<State>(
  initial: (environment: Environment) => State,
): (context: PluginContext) => State {
  const stateMap = new WeakMap<Environment, State>()
  return function (context: PluginContext) {
    const { environment } = context
    if (!environment) {
      context.error(
        new Error(
          `Per environment state called with undefined environment. You may be using a Vite v6+ plugin in Vite v5 or Rollup.`,
        ),
      )
    }
    let state = stateMap.get(environment)
    if (!state) {
      state = initial(environment)
      stateMap.set(environment, state)
    }
    return state
  }
}
