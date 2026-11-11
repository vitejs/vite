import { describe, expect, test } from 'vitest'
import { prettyFormat } from '../pretty-format'

describe('prettyFormat', () => {
  test('formats basic JavaScript values', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular

    expect(
      prettyFormat({
        array: [1, 'two'],
        date: new Date('2020-01-01T00:00:00.000Z'),
        error: new Error('boom'),
        circular,
      }),
    ).toMatchInlineSnapshot(
      `"{ array: [ 1, "two" ], date: 2020-01-01T00:00:00.000Z, error: [Error: boom], circular: { self: [Circular] } }"`,
    )
  })

  test('limits depth and collection width', () => {
    expect(prettyFormat({ a: { b: { c: { d: true } } } })).toBe(
      '{ a: { b: { c: [Object] } } }',
    )
    expect(prettyFormat([1, 2, 3, 4], { maxWidth: 2 })).toBe('[ 1, 2, …(2) ]')
  })
})
