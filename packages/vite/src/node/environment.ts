import type { DevEnvironment } from './server/environment'
import type { BuildEnvironment } from './build'
import type { ScanEnvironment } from './optimizer/scan'
import { type FutureCompatEnvironment } from './baseEnvironment'

export type Environment =
  | DevEnvironment
  | BuildEnvironment
  | ScanEnvironment
  | FutureCompatEnvironment

export function cachedByEnvironment<Data>(
  create: (environment: Environment) => Data,
): (environment: Environment) => Data {
  const cache = new WeakMap<Environment, Data>()
  return function (environment: Environment) {
    let data = cache.get(environment)
    if (!data) {
      data = create(environment)
      cache.set(environment, data)
    }
    return data
  }
}
