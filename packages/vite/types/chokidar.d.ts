export type {
  FSWatcher,
  WatchOptions,
  AwaitWriteFinishOptions
} from '../dist/node'

import type { FSWatcher, WatchOptions } from '../dist/node'
export function watch(
  paths: string | ReadonlyArray<string>,
  options?: WatchOptions
): FSWatcher
