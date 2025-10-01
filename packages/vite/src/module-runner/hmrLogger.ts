import type { HMRLogger } from '../shared/hmr'

const noop = (): void => {}

export const silentConsole: HMRLogger = {
  debug: noop,
  error: noop,
}

export const hmrLogger: HMRLogger = {
  debug: (...msg) => console.log('[vite]', ...msg),
  error: (error) => console.log('[vite]', error),
}
