import { describe, expect, test } from 'vitest'
import type { Plugin } from '../plugin'
import {
  getCachedFilterForPlugin,
  getHookHandler,
  getSortedPluginsByHook,
} from '../plugins/index'

describe('getSortedPluginsByHook', () => {
  test('orders pre, normal, and post hooks while preserving their relative order', () => {
    const plugins = [
      {
        name: 'normal-1',
        transform() {
          /* noop */
        },
      },
      {
        name: 'post-1',
        transform: {
          order: 'post',
          handler() {
            /* noop */
          },
        },
      },
      {
        name: 'pre-1',
        transform: {
          order: 'pre',
          handler() {
            /* noop */
          },
        },
      },
      {
        name: 'normal-2',
        transform() {
          /* noop */
        },
      },
      {
        name: 'pre-2',
        transform: {
          order: 'pre',
          handler() {
            /* noop */
          },
        },
      },
    ] as Plugin[]

    expect(
      getSortedPluginsByHook('transform', plugins).map((p) => p.name),
    ).toEqual(['pre-1', 'pre-2', 'normal-1', 'normal-2', 'post-1'])
  })

  test('ignores plugins without the specified hook', () => {
    const plugins = [
      {
        name: 'has-hook-normal',
        transform() {
          /* noop */
        },
      },
      { name: 'no-hook' },
      {
        name: 'has-hook-pre',
        transform: {
          order: 'pre',
          handler() {
            /* noop */
          },
        },
      },
    ] as Plugin[]

    expect(
      getSortedPluginsByHook('transform', plugins).map((p) => p.name),
    ).toEqual(['has-hook-pre', 'has-hook-normal'])
  })
})

describe('getHookHandler', () => {
  test('returns the hook directly if it is a function', () => {
    const hookFn = () => {
      /* noop */
    }
    expect(getHookHandler(hookFn as any)).toBe(hookFn)
  })

  test('returns the handler property if the hook is an object', () => {
    const handlerFn = () => {
      /* noop */
    }
    const hookObj = { order: 'pre', handler: handlerFn }
    expect(getHookHandler(hookObj as any)).toBe(handlerFn)
  })
})

describe('getCachedFilterForPlugin', () => {
  test('returns undefined when plugin has no filter', () => {
    const plugin = { name: 'no-filter' } as Plugin
    expect(getCachedFilterForPlugin(plugin, 'transform')).toBeUndefined()
  })

  test('creates and caches filter for a specific hook (transform filter)', () => {
    const plugin: Plugin = {
      name: 'transform-filter',
      transform: {
        filter: {
          id: { include: 'test' },
        },
        handler: () => {
          /* noop */
        },
      } as any,
    }

    const filter = getCachedFilterForPlugin(plugin, 'transform')
    expect(filter).toBeDefined()
    expect(typeof filter).toBe('function')

    // second call should return the exact same cached filter
    const filter2 = getCachedFilterForPlugin(plugin, 'transform')
    expect(filter2).toBe(filter)
  })

  test('creates and caches filter for id filter', () => {
    const plugin: Plugin = {
      name: 'id-filter',
      resolveId: {
        filter: {
          id: { include: 'test' },
        },
        handler: () => {
          /* noop */
        },
      } as any,
    }

    const filter = getCachedFilterForPlugin(plugin, 'resolveId')
    expect(filter).toBeDefined()

    const filter2 = getCachedFilterForPlugin(plugin, 'resolveId')
    expect(filter2).toBe(filter)
  })

  test('differentiates cache by hook name', () => {
    const plugin: Plugin = {
      name: 'multi-filter',
      transform: {
        filter: { id: { include: 'test' } },
        handler: () => {
          /* noop */
        },
      } as any,
      resolveId: {
        filter: { id: { include: 'test' } },
        handler: () => {
          /* noop */
        },
      } as any,
    }

    const transformFilter = getCachedFilterForPlugin(plugin, 'transform')
    const resolveIdFilter = getCachedFilterForPlugin(plugin, 'resolveId')

    expect(transformFilter).toBeDefined()
    expect(resolveIdFilter).toBeDefined()
    expect(transformFilter).not.toBe(resolveIdFilter as any)
  })
})
