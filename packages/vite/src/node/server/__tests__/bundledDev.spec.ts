import type { RolldownOutput } from 'rolldown'
import { afterEach, describe, expect, test, vi } from 'vitest'
import type { HotPayload } from '#types/hmrPayload'
import { BundledDev } from '../bundledDev'

function setup() {
  const sent: HotPayload[] = []
  const environment = {
    hot: { send: (payload: HotPayload) => sent.push(payload) },
    logger: { info: () => {}, error: () => {} },
    config: { root: '/root' },
  }
  const bundledDev = new BundledDev(environment as any)
  const output = { output: [] } as unknown as RolldownOutput
  const fullReloads = () =>
    sent.filter((payload) => payload.type === 'full-reload').length
  const errors = () => sent.filter((payload) => payload.type === 'error').length
  return { bundledDev, output, fullReloads, errors }
}

describe('BundledDev', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // The engine reloads every page when the graph is built from scratch, for
  // example after a tsconfig edit. That reload sends no push. Until a later
  // push makes a page ask the server (and get a reload), only this pending
  // reload replaces the page.
  test('keeps a full reload pending across a failed build', () => {
    vi.useFakeTimers()
    const { bundledDev, output, fullReloads, errors } = setup()

    bundledDev.handleHmrUpdates({
      update: { type: 'FullReload', reason: 'tsconfig change' },
      changedFiles: ['/root/tsconfig.json'],
    })
    // the full build fails: the overlay shows, and nothing reloads
    bundledDev.handleOutput(new Error('Unexpected token'), undefined)
    vi.advanceTimersByTime(100)
    expect(errors()).toBe(1)
    expect(fullReloads()).toBe(0)

    // a source fix that is not a tsconfig edit builds again
    bundledDev.handleOutput(output, { hmrGeneration: 3 })
    vi.advanceTimersByTime(100)
    expect(fullReloads()).toBe(1)
    expect(bundledDev.outputGeneration).toBe(3)

    // the reload went out once
    bundledDev.handleOutput(output, { hmrGeneration: 3 })
    vi.advanceTimersByTime(100)
    expect(fullReloads()).toBe(1)
  })
})
