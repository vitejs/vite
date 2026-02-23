import { describe, expect, test } from 'vitest'
import { formatConsoleArgs } from '../../shared/forwardConsole'

describe('formatConsoleArgs', () => {
  test('formats placeholders similar to browser console', () => {
    const message = formatConsoleArgs([
      'format: string=%s number=%d int=%i float=%f json=%j object=%o object2=%O style=%c literal=%% trailing',
      'hello',
      12.9,
      '42px',
      '3.5',
      { id: 1 },
      { enabled: true },
      { nested: { deep: 1 } },
      'color:red',
      'done',
    ])

    expect(message).toMatchInlineSnapshot(
      '"format: string=hello number=12.9 int=42 float=3.5 json={"id":1} object={"enabled":true} object2={"nested":{"deep":1}} style= literal=% trailing done"',
    )
  })

  test('formats non-template arguments', () => {
    function sampleFn() {
      return undefined
    }
    expect(
      formatConsoleArgs([{ ok: true }, Symbol.for('x'), sampleFn]),
    ).toMatchInlineSnapshot('"{"ok":true} Symbol(x) [Function: sampleFn]"')
  })

  test('formats circular values for %j', () => {
    const circular: any = {}
    circular.self = circular

    expect(formatConsoleArgs(['circular=%j', circular])).toMatchInlineSnapshot(
      '"circular=[Circular]"',
    )
  })
})
