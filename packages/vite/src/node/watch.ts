import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import { subscribe } from '@parcel/watcher'
import type {
  AsyncSubscription,
  Event as ParcelEvent,
  Options as WatchOptions,
} from '@parcel/watcher'
import type { ChokidarOptions } from 'rollup'
import glob from 'fast-glob'
// @ts-expect-error no types
import globParent from 'glob-parent'
import micromatch from 'micromatch'
import type { ResolvedConfig } from './config'
import { tryStatSync } from './utils'

export class Watcher extends EventEmitter {
  #opts: WatchOptions
  #recursiveWatchers: Promise<AsyncSubscription>[] = []
  #shallowWatchers: fs.FSWatcher[] = []

  #watchedDirs = new Set<string | ((p: string) => boolean)>()
  #unwatchedPaths = new Set<string | ((p: string) => boolean)>()

  constructor(root: string, opts: WatchOptions) {
    super()
    this.#opts = opts
    // Special case for root as its a path but should watch recursive by default.
    // Otherwise only globs added to `.add` will be watched recursively
    this.#watchRecursiveDir(root).then(() => {
      this.emit('ready')
    })
    this.#watchedDirs.add((p) => p.startsWith(root))
  }

  // All chokidar events except "raw" as it's internal
  override on(
    event: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir',
    listener: (path: string) => void,
  ): this
  override on(
    event: 'all',
    listener: (
      eventName: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir',
      path: string,
    ) => void,
  ): this
  override on(event: 'error', listener: (error: Error) => void): this
  override on(event: 'ready', listener: () => void): this
  override on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener)
  }

  // Unwatching paths will simply ignore the paths forever
  unwatch(paths: string | string[]): this {
    if (Array.isArray(paths)) {
      for (const p of paths) {
        this.unwatch(p)
      }
      return this
    }

    if (glob.isDynamicPattern(paths)) {
      this.#unwatchedPaths.add(micromatch.matcher(paths))
    } else {
      this.#unwatchedPaths.add(paths)
    }
    return this
  }

  getWatched(): Record<string, any> {
    // Unimplemented
    return {}
  }

  async close(): Promise<void> {
    await Promise.all([
      ...this.#recursiveWatchers.map(async (w) => (await w).unsubscribe()),
      ...this.#shallowWatchers.map((w) => w.close()),
    ])
  }

  /**
   * Watch additional paths
   */
  add(paths: string | string[]): this {
    if (Array.isArray(paths)) {
      for (const p of paths) {
        this.add(p)
      }
      return this
    }

    let dirToWatch: string
    const isGlob = glob.isDynamicPattern(paths)
    if (isGlob) {
      dirToWatch = globParent(paths)
    } else {
      dirToWatch = tryStatSync(paths)?.isFile() ? path.dirname(paths) : paths
    }

    // skip if already watched
    if (!this.#isPathReallyWatched(dirToWatch)) {
      return this
    }

    // Watch directory
    if (isGlob) {
      this.#watchRecursiveDir(dirToWatch)
      this.#watchedDirs.add(micromatch.matcher(paths))
    } else {
      this.#watchShallowDir(dirToWatch)
      this.#watchedDirs.add(paths)
    }
    return this
  }

  /**
   * Watch recursively with `@parcel/bundler`
   */
  #watchRecursiveDir(dir: string) {
    const sub = subscribe(
      dir,
      (error, events) => {
        if (error) {
          this.emit('error', error)
        } else {
          for (const event of events) {
            const eventName = parcelEventToChokidarEvent(event)
            this.emit(eventName, event.path)
          }
        }
      },
      this.#opts,
    )
    this.#recursiveWatchers.push(sub)
    return sub
  }

  /**
   * Watch shallowly with `node:fs`
   * https://github.com/parcel-bundler/watcher/issues/92
   */
  #watchShallowDir(dir: string) {
    const watcher = fs.watch(dir, {}, (eventType, filename) => {
      if (filename && this.#isPathReallyWatched(filename)) {
        const eventPath = path.join(dir, filename)
        const eventName = nodeEventToChokidarEvent({
          type: eventType,
          path: eventPath,
        })
        this.emit(eventName, eventPath)
      }
    })
    watcher.on('error', (error) => {
      this.emit('error', error)
    })
    this.#shallowWatchers.push(watcher)
    return watcher
  }

  #isPathReallyWatched(p: string) {
    return this.#isPathWatched(p) && !this.#isPathUnwatched(p)
  }

  #isPathWatched(p: string) {
    for (const watched of this.#watchedDirs) {
      if (typeof watched === 'string' ? watched === p : watched(p)) {
        return true
      }
    }
    return false
  }

  #isPathUnwatched(p: string) {
    for (const unwatched of this.#unwatchedPaths) {
      if (typeof unwatched === 'string' ? unwatched === p : unwatched(p)) {
        return true
      }
    }
    return false
  }
}

export class NoopWatcher extends EventEmitter {
  add(): this {
    return this
  }

  unwatch(): this {
    return this
  }

  getWatched(): Record<string, any> {
    return {}
  }

  async close(): Promise<void> {
    // noop
  }
}

export function resolveWatchOptions(
  config: ResolvedConfig,
  options: WatchOptions | null | undefined,
): WatchOptions {
  const { ignore = [], ...otherOptions } = options ?? {}

  const resolvedWatchOptions: WatchOptions = {
    ignore: [
      '**/.git/**',
      '**/node_modules/**',
      '**/test-results/**', // Playwright
      glob.escapePath(config.cacheDir) + '/**',
      ...(Array.isArray(ignore) ? ignore : [ignore]),
    ],
    ...otherOptions,
  }

  return resolvedWatchOptions
}

export function resolveChokidarOptions(
  config: ResolvedConfig,
  options: ChokidarOptions | undefined,
): ChokidarOptions {
  const { ignored = [], ...otherOptions } = options ?? {}

  const resolvedWatchOptions: ChokidarOptions = {
    ignored: [
      '**/.git/**',
      '**/node_modules/**',
      '**/test-results/**', // Playwright
      glob.escapePath(config.cacheDir) + '/**',
      ...(Array.isArray(ignored) ? ignored : [ignored]),
    ],
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ...otherOptions,
  }

  return resolvedWatchOptions
}

function parcelEventToChokidarEvent(event: ParcelEvent): string {
  switch (event.type) {
    case 'create': {
      if (tryStatSync(event.path)?.isDirectory()) {
        return 'addDir'
      } else {
        return 'add'
      }
    }
    case 'update':
      return 'change'
    case 'delete': {
      if (event.path.endsWith(path.sep)) {
        return 'unlinkDir'
      } else {
        return 'unlink'
      }
    }
  }
}

interface NodeEvent {
  type: fs.WatchEventType
  path: string
}

function nodeEventToChokidarEvent(event: NodeEvent) {
  switch (event.type) {
    case 'rename': {
      const stat = tryStatSync(event.path)
      if (stat == null) {
        if (event.path.endsWith(path.sep)) {
          return 'unlinkDir'
        } else {
          return 'unlink'
        }
      } else {
        if (stat.isDirectory()) {
          return 'addDir'
        } else {
          return 'add'
        }
      }
    }
    case 'change':
      return 'change'
  }
}
