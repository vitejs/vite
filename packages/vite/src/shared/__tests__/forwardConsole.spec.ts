import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  formatConsoleArgs,
  setupForwardConsoleHandler,
} from '../forwardConsole'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function waitForUnhandledRejectionCheck() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('formatConsoleArgs', () => {
  test('formats placeholders', () => {
    expect(
      formatConsoleArgs([
        'format: string=%s number=%d int=%i float=%f json=%j object=%o object2=%O sym=%d style=%c literal=%% trailing',
        'hello',
        12.9,
        '42px',
        '3.5',
        { id: 1 },
        { enabled: true },
        { nested: { deep: 1 } },
        Symbol.for('x'),
        'color:red',
        'done',
      ]),
    ).toMatchInlineSnapshot(
      `"format: string=hello number=12.9 int=42 float=3.5 json={"id":1} object={"enabled":true} object2={"nested":{"deep":1}} sym=NaN style= literal=% trailing done"`,
    )

    expect(
      formatConsoleArgs(['num=%d int=%i pct=%% miss=%s sym=%d', 3.14, '42px']),
    ).toMatchInlineSnapshot(`"num=3.14 int=42 pct=% miss=%s sym=%d"`)
  })

  test('stringifies diverse non-template arguments', () => {
    const topError = new Error('boom')
    topError.stack = undefined

    const nestedError = new Error('nested')
    nestedError.stack = undefined

    const circular: any = {
      ok: true,
      big: 2n,
      err: nestedError,
    }
    circular.self = circular

    function sampleFn() {
      return undefined
    }

    expect(
      formatConsoleArgs([
        1n,
        undefined,
        true,
        Symbol.for('s'),
        sampleFn,
        topError,
        circular,
      ]),
    ).toMatchInlineSnapshot(
      `"1n undefined true Symbol(s) [Function: sampleFn] Error: boom {"ok":true,"big":"2n","err":{"name":"Error","message":"nested"},"self":"[Circular]"}"`,
    )
  })
})

describe('setupForwardConsoleHandler', () => {
  test('swallows transport errors while forwarding unhandled rejections', async () => {
    const transport = {
      send: vi
        .fn()
        .mockRejectedValue(new Error('send was called before connect')),
    }
    const unhandledRejections: unknown[] = []
    const onUnhandledRejection = (reason: unknown) => {
      unhandledRejections.push(reason)
    }
    process.on('unhandledRejection', onUnhandledRejection)

    try {
      const window = new EventTarget()
      vi.stubGlobal('window', window)
      setupForwardConsoleHandler(transport as any, {
        enabled: true,
        unhandledErrors: true,
        logLevels: [],
      })

      const event = new Event('unhandledrejection') as Event & {
        reason: unknown
      }
      Object.defineProperty(event, 'reason', {
        value: new Error('original rejection'),
      })
      window.dispatchEvent(event)

      await waitForUnhandledRejectionCheck()

      expect(transport.send).toHaveBeenCalledTimes(1)
      expect(unhandledRejections).toEqual([])
    } finally {
      process.off('unhandledRejection', onUnhandledRejection)
    }
  })

  test('swallows transport errors while forwarding console logs', async () => {
    const consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const transport = {
      send: vi
        .fn()
        .mockRejectedValue(new Error('send was called before connect')),
    }
    const unhandledRejections: unknown[] = []
    const onUnhandledRejection = (reason: unknown) => {
      unhandledRejections.push(reason)
    }
    process.on('unhandledRejection', onUnhandledRejection)

    try {
      setupForwardConsoleHandler(transport as any, {
        enabled: true,
        unhandledErrors: false,
        logLevels: ['debug'],
      })

      console.debug('after disconnect')

      await waitForUnhandledRejectionCheck()

      expect(consoleDebug).toHaveBeenCalledWith('after disconnect')
      expect(transport.send).toHaveBeenCalledTimes(1)
      expect(unhandledRejections).toEqual([])
    } finally {
      process.off('unhandledRejection', onUnhandledRejection)
    }
  })
})
