import { describe, expect, it } from 'vitest'
import { convertToDevWatchOptions, resolveChokidarOptions } from '../watch'
import type { ServerWatchOptions } from '../watch'

describe('bundled dev watcher options', () => {
  it('passes polling and debounce settings to the Rolldown watcher', () => {
    const options: ServerWatchOptions = {
      usePolling: true,
      interval: 100,
      pollInterval: 250,
      useDebounce: false,
      debounceDuration: 0,
      debounceTickRate: 50,
      compareContentsForPolling: true,
      include: ['src/**'],
      exclude: [/\.test\.ts$/],
    }

    expect(convertToDevWatchOptions(options)).toEqual({
      watcher: {
        usePolling: true,
        pollInterval: 250,
        useDebounce: false,
        debounceDelay: 0,
        debounceTickRate: 50,
        compareContentsForPolling: true,
      },
      include: options.include,
      exclude: options.exclude,
    })
  })

  it.each([
    [undefined, 100],
    [0, 0],
  ])(
    'resolves pollInterval %s with a chokidar interval',
    (pollInterval, expected) => {
      const options = convertToDevWatchOptions({
        usePolling: true,
        interval: 100,
        pollInterval,
      })

      expect(options.watcher?.pollInterval).toBe(expected)
    },
  )

  it('keeps default and disabled watching distinct', () => {
    expect(convertToDevWatchOptions(undefined)).toEqual({})
    expect(convertToDevWatchOptions(null)).toEqual({ enabled: false })
  })

  it('does not pass Rolldown-only settings to chokidar', () => {
    const options = resolveChokidarOptions(
      {
        usePolling: true,
        interval: 100,
        pollInterval: 250,
        useDebounce: false,
        debounceDuration: 0,
        debounceTickRate: 50,
        compareContentsForPolling: true,
        include: ['src/**'],
        exclude: ['dist/**'],
      },
      new Set(),
      false,
      '/project/node_modules/.vite',
    )

    expect(options).toMatchObject({ usePolling: true, interval: 100 })
    for (const key of [
      'watcher',
      'pollInterval',
      'useDebounce',
      'debounceDuration',
      'debounceTickRate',
      'compareContentsForPolling',
      'include',
      'exclude',
    ]) {
      expect(options).not.toHaveProperty(key)
    }
  })
})
