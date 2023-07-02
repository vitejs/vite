import path from 'node:path'
import { subscribe } from '@parcel/watcher'
import type { AsyncSubscription, Event, Options } from '@parcel/watcher'
import glob from 'fast-glob'
import type { ResolvedConfig } from './config'
import { tryStatSync } from './utils'

export type WatchEventHandler = (event: Event) => void

export class Watcher {
  private watchedDirs: string[] = []
  private watchers = new Map<string, Promise<AsyncSubscription>>()
  private eventHandlers = new Set<WatchEventHandler>()

  constructor(private opts: Options) {}

  on(eventHandler: WatchEventHandler): void {
    this.eventHandlers.add(eventHandler)
  }

  off(eventHandler: WatchEventHandler): void {
    this.eventHandlers.delete(eventHandler)
  }

  async close(): Promise<void> {
    for (const watcher of this.watchers.values()) {
      await (await watcher).unsubscribe()
    }
  }

  /**
   * Watch additional paths
   */
  add(paths: string[]): void {
    const dirs = paths.map((p) => {
      if (tryStatSync(p)?.isFile()) {
        return path.dirname(p)
      } else {
        return p
      }
    })

    for (const p of dirs) {
      const isPathWatched = this.watchedDirs.some((dir) => p.startsWith(dir))
      if (!isPathWatched) {
        this.watchDir(p)
      }
    }

    // If we're watching /foo/bar and /foo, remove /foo/bar from the list as /foo already covers it
    for (const dir of this.watchedDirs) {
      const isNestedWatched = this.watchedDirs.some((p) => dir.startsWith(p))
      if (!isNestedWatched) {
        this.watchedDirs.splice(this.watchedDirs.indexOf(dir), 1)
        this.watchers.get(dir)?.then((w) => w.unsubscribe())
        this.watchers.delete(dir)
      }
    }
  }

  private watchDir(dir: string) {
    this.watchedDirs.push(dir)
    this.watchers.set(
      dir,
      subscribe(dir, this.handleSubscribeHandler.bind(this), this.opts),
    )
  }

  private handleSubscribeHandler(err: Error | null, events: Event[]) {
    // TODO: what kind of errors can we get here?
    if (err) throw err

    for (const event of events) {
      for (const eventHandler of this.eventHandlers) {
        eventHandler(event)
      }
    }
  }
}

export function resolveWatchOptions(
  config: ResolvedConfig,
  options: Options | undefined,
): Options {
  const { ignore = [], ...otherOptions } = options ?? {}

  const resolvedWatchOptions: Options = {
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
