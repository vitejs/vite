import type { HMRLogger } from '../shared/hmr'

const noop = (): void => {}

export const silentConsole: HMRLogger = {
  debug: noop,
  error: noop,
}
