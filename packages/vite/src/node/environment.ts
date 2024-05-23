import type { DevEnvironment } from './server/environment'
import type { BuildEnvironment } from './build'
import type { ScanEnvironment } from './optimizer/scan'
import { type FutureCompatEnvironment } from './baseEnvironment'

export type Environment =
  | DevEnvironment
  | BuildEnvironment
  | ScanEnvironment
  | FutureCompatEnvironment
