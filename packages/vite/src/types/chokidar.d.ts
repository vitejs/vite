// Inlined with the following changes:
// 1. Rename `ChokidarOptions` to `WatchOptions` (compat with chokidar v3)
// 2. Remove internal properties exposed from `FSWatcher`
// 3. Remove unneeded types from the tweaks above
// 4. Add spacing and formatted for readability

// https://cdn.jsdelivr.net/npm/chokidar/index.d.ts
// https://cdn.jsdelivr.net/npm/chokidar/handler.d.ts
// MIT Licensed https://github.com/paulmillr/chokidar/blob/master/LICENSE

import type { Stats } from 'node:fs'
import type { EventEmitter } from 'node:events'

// #region handler.d.ts

declare const EVENTS: {
  readonly ALL: 'all'
  readonly READY: 'ready'
  readonly ADD: 'add'
  readonly CHANGE: 'change'
  readonly ADD_DIR: 'addDir'
  readonly UNLINK: 'unlink'
  readonly UNLINK_DIR: 'unlinkDir'
  readonly RAW: 'raw'
  readonly ERROR: 'error'
}
type EventName = (typeof EVENTS)[keyof typeof EVENTS]

type Path = string

// #endregion

// #region index.d.ts

type AWF = {
  stabilityThreshold: number
  pollInterval: number
}
type BasicOpts = {
  persistent: boolean
  ignoreInitial: boolean
  followSymlinks: boolean
  cwd?: string
  usePolling: boolean
  interval: number
  binaryInterval: number
  alwaysStat?: boolean
  depth?: number
  ignorePermissionErrors: boolean
  atomic: boolean | number
}

export type WatchOptions = Partial<
  BasicOpts & {
    ignored: Matcher | Matcher[]
    awaitWriteFinish: boolean | Partial<AWF>
  }
>

export type FSWInstanceOptions = BasicOpts & {
  ignored: Matcher[]
  awaitWriteFinish: false | AWF
}

export type EmitArgs = [EventName, Path | Error, any?, any?, any?]

export type MatchFunction = (val: string, stats?: Stats) => boolean

export interface MatcherObject {
  path: string
  recursive?: boolean
}

export type Matcher = string | RegExp | MatchFunction | MatcherObject

/**
 * Watches files & directories for changes. Emitted events:
 * `add`, `addDir`, `change`, `unlink`, `unlinkDir`, `all`, `error`
 *
 *     new FSWatcher()
 *       .add(directories)
 *       .on('add', path => log('File', path, 'was added'))
 */
export declare class FSWatcher extends EventEmitter {
  closed: boolean
  options: FSWInstanceOptions

  constructor(_opts?: WatchOptions)

  /**
   * Adds paths to be watched on an existing FSWatcher instance.
   * @param paths_ file or file list. Other arguments are unused
   */
  add(paths_: Path | Path[], _origAdd?: string, _internal?: boolean): FSWatcher
  /**
   * Close watchers or start ignoring events from specified paths.
   */
  unwatch(paths_: Path | Path[]): FSWatcher
  /**
   * Close watchers and remove all listeners from watched paths.
   */
  close(): Promise<void>
  /**
   * Expose list of watched paths
   * @returns for chaining
   */
  getWatched(): Record<string, string[]>
  emitWithAll(event: EventName, args: EmitArgs): void
}

/**
 * Instantiates watcher with paths to be tracked.
 * @param paths file / directory paths
 * @param options opts, such as `atomic`, `awaitWriteFinish`, `ignored`, and others
 * @returns an instance of FSWatcher for chaining.
 * @example
 * const watcher = watch('.').on('all', (event, path) => { console.log(event, path); });
 * watch('.', { atomic: true, awaitWriteFinish: true, ignored: (f, stats) => stats?.isFile() && !f.endsWith('.js') })
 */
export declare function watch(
  paths: string | string[],
  options?: WatchOptions,
): FSWatcher

declare const _default: {
  watch: typeof watch
  FSWatcher: typeof FSWatcher
}
export default _default

// #endregion
