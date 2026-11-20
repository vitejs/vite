import { expect, test } from 'vitest'
import { convertToDevWatchOptions } from '../watch'

test('bundled dev uses nested watcher options over Chokidar polling options', () => {
  const watcher = {
    usePolling: false,
    pollInterval: 20,
    compareContentsForPolling: true,
    useDebounce: true,
    debounceDelay: 10,
    debounceTickRate: 5,
  }
  expect(
    convertToDevWatchOptions({
      usePolling: true,
      interval: 1000,
      watcher,
      include: '**/src/**',
      exclude: '**/dist/**',
    }),
  ).toStrictEqual({
    watcher,
    include: '**/src/**',
    exclude: '**/dist/**',
  })
})

test('bundled dev falls back to Chokidar polling options', () => {
  expect(
    convertToDevWatchOptions({ usePolling: true, interval: 50 }).watcher,
  ).toStrictEqual({ usePolling: true, pollInterval: 50 })
})
