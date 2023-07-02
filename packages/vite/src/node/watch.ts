import fs from 'node:fs'
import path from 'node:path'
import type { FSWatcher, WatchEventType } from 'node:fs'
import glob from 'fast-glob'
import picomatch from 'picomatch'
import type { ResolvedConfig } from '.'

export type WatchEventHandler = (event: WatchEventType, file: string) => void

export interface WatchOptions {
  ignored?: string[]
}

export class Watcher {
  private watchers: FSWatcher[] = []
  private eventHandlers = new Set<WatchEventHandler>()
  private matcher: ReturnType<typeof picomatch> | undefined

  constructor(opts: WatchOptions) {
    if (opts.ignored) {
      this.matcher = picomatch(opts.ignored, {})
    }
  }

  on(eventHandler: WatchEventHandler): void {
    this.eventHandlers.add(eventHandler)
  }

  off(eventHandler: WatchEventHandler): void {
    this.eventHandlers.delete(eventHandler)
  }

  close(): void {
    this.watchers.forEach((w) => w.close())
  }

  /**
   * Watch additional paths
   */
  add(paths: string[]): void {
    for (const p of paths) {
      fs.watch(p, (event, file) => {
        if (!file) return
        if (file !== p) file = path.join(p, file)
        if (this.isPathIgnored(file)) return
        this.throttleEvent(event, file)
      })
    }
  }

  private isPathIgnored(file: string): boolean {
    return !this.matcher || this.matcher(file)
  }

  // Throttle events as Node.js sometimes over-triggers events
  private throttledKeys = new Set<string>()
  private throttleEvent(event: WatchEventType, file: string) {
    const key = `${event}:${file}`
    if (this.throttledKeys.has(key)) return

    this.throttledKeys.add(key)
    setTimeout(() => {
      for (const eventHandler of this.eventHandlers) {
        eventHandler(event, file)
      }
      this.throttledKeys.delete(key)
    }, 10)
  }
}
export function resolveWatchOptions(
  config: ResolvedConfig,
  options: WatchOptions | undefined,
): WatchOptions {
  const { ignored = [], ...otherOptions } = options ?? {}

  const resolvedWatchOptions: WatchOptions = {
    ignored: [
      '**/.git/**',
      '**/node_modules/**',
      '**/test-results/**', // Playwright
      glob.escapePath(config.cacheDir) + '/**',
      ...(Array.isArray(ignored) ? ignored : [ignored]),
    ],
    ...otherOptions,
  }

  return resolvedWatchOptions
}
