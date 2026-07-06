import { describe, expect, test, vi } from 'vitest'
import { BundledDev } from '../bundledDev'

describe('BundledDev.waitForInitialBuildFinish', () => {
  test('waits for first in-memory output before resolving', async () => {
    const bundledDev = new BundledDev({ name: 'client' } as any)

    const ensureCurrentBuildFinish = vi.fn(async () => {})
    const getBundleState = vi.fn(async () => ({
      lastBuildErrored: true,
      lastErrorStage: 'Build',
    }))

    ;(bundledDev as any)._devEngine = {
      ensureCurrentBuildFinish,
      getBundleState,
    }

    const pending = (bundledDev as any).waitForInitialBuildFinish()

    // Simulate that the initial successful output arrives later.
    globalThis.setTimeout(() => {
      bundledDev.memoryFiles.set('assets/main.js', {
        source: 'export default 1',
      })
    }, 30)

    await pending

    expect(ensureCurrentBuildFinish).toHaveBeenCalled()
    expect(getBundleState).not.toHaveBeenCalled()
  })

  test('resolves quickly when output already exists', async () => {
    const bundledDev = new BundledDev({ name: 'client' } as any)
    const ensureCurrentBuildFinish = vi.fn(async () => {})

    ;(bundledDev as any)._devEngine = {
      ensureCurrentBuildFinish,
    }

    bundledDev.memoryFiles.set('assets/main.js', { source: 'export default 1' })

    await (bundledDev as any).waitForInitialBuildFinish()

    expect(ensureCurrentBuildFinish).toHaveBeenCalledTimes(1)
  })
})
