import { setTimeout } from 'node:timers/promises'
import { describe, expect, test, vi } from 'vitest'
import {
  formatConsoleArgs,
  setupForwardConsoleHandler,
} from '../forwardConsole'
import {
  type NormalizedModuleRunnerTransport,
  SendBeforeConnectError,
} from '../moduleRunnerTransport'

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
      `"format: string=hello number=12.9 int=42 float=3.5 json={"id":1} object={ enabled: true } object2={ nested: { deep: 1 } } sym=NaN style= literal=% trailing done"`,
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
      `"1n undefined true Symbol(s) [Function: sampleFn] Error: boom { ok: true, big: 2n, err: [Error: nested], self: [Circular] }"`,
    )
  })

  test('limits object depth and width', () => {
    const deep = { a: { b: { c: { d: true } } } }
    expect(formatConsoleArgs([deep])).toMatchInlineSnapshot(
      `"{ a: { b: { c: [Object] } } }"`,
    )

    const wide = Object.fromEntries(
      Array.from({ length: 101 }, (_, i) => [`k${i}`, i]),
    )
    expect(formatConsoleArgs([wide])).toContain('…(1)')
    expect(formatConsoleArgs([wide])).not.toContain('k100')
  })

  test('limits large object output', () => {
    function makeTree(depth: number, breadth: number): unknown {
      if (depth === 0) return { leaf: true }
      return Object.fromEntries(
        Array.from({ length: breadth }, (_, i) => [
          `k${i}`,
          makeTree(depth - 1, breadth),
        ]),
      )
    }

    const output = formatConsoleArgs([
      'one console.warn with a large object:',
      makeTree(6, 6),
    ])

    expect(output.length).toBeLessThan(10_000)
    expect(output).toContain('[Object]')
  })
})

describe('setupForwardConsoleHandler', () => {
  function createMockConsole() {
    return {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
      debug: vi.fn(),
    } as unknown as Console
  }

  function createMockTransport(
    send: (...args: any[]) => Promise<void>,
  ): NormalizedModuleRunnerTransport {
    return {
      connect: () => Promise.resolve(),
      disconnect: () => Promise.resolve(),
      send,
      invoke: () => Promise.resolve({ result: undefined } as any),
    }
  }

  test('ignore SendBeforeConnectError from transport.send', async () => {
    const transport = createMockTransport(() =>
      Promise.reject(new SendBeforeConnectError('not connected yet')),
    )
    const console = createMockConsole()

    setupForwardConsoleHandler(
      transport,
      {
        enabled: true,
        unhandledErrors: false,
        logLevels: ['log'],
      },
      console,
    )

    console.log('hi')
    await setTimeout(50)

    expect(console.error).not.toHaveBeenCalled()
  })

  test('log errors from transport.send', async () => {
    const transport = createMockTransport(() =>
      Promise.reject(new Error('other error')),
    )
    const console = createMockConsole()

    setupForwardConsoleHandler(
      transport,
      {
        enabled: true,
        unhandledErrors: false,
        logLevels: ['log'],
      },
      console,
    )

    console.log('hi')
    await setTimeout(50)

    expect(console.error).toHaveBeenCalledWith(
      'Failed to send error to Vite server:',
      new Error('other error'),
    )
  })

  test('caps the forwarded console message', () => {
    const send = vi.fn(() => Promise.resolve())
    const transport = createMockTransport(send)
    const console = createMockConsole()

    setupForwardConsoleHandler(
      transport,
      {
        enabled: true,
        unhandledErrors: false,
        logLevels: ['log'],
      },
      console,
    )

    console.log('x'.repeat(20_000))

    const message = send.mock.calls[0][0].data.data.message
    expect(message).toBe(`${'x'.repeat(9_999)}…`)
  })
})
