import { describe, expect, test } from 'vitest'
import { jsonStringifyBuffer } from '../../plugins/asset'

describe('jsonStringifyBuffer', () => {
  // The `?raw` import handler embeds file contents as a JS string literal in
  // the generated module. `jsonStringifyBuffer` is the bytes-direct equivalent
  // of `JSON.stringify(buffer.toString('utf-8'))` and exists to keep peak
  // heap usage bounded for very large `?raw` imports (see #22132).

  test('matches JSON.stringify on the empty input', () => {
    const buffer = Buffer.from('', 'utf-8')
    expect(jsonStringifyBuffer(buffer)).toBe(JSON.stringify(''))
  })

  test('matches JSON.stringify on plain ASCII without escapes', () => {
    const input = 'hello world! 0123456789 ~`<>?,./;:[]{}=+-_)(*&^%$#@!'
    expect(jsonStringifyBuffer(Buffer.from(input, 'utf-8'))).toBe(
      JSON.stringify(input),
    )
  })

  test('escapes the JSON string-literal special characters', () => {
    const input = 'quote " backslash \\ slash /'
    expect(jsonStringifyBuffer(Buffer.from(input, 'utf-8'))).toBe(
      JSON.stringify(input),
    )
  })

  test('uses short escapes for the standard control characters', () => {
    const input = '\b\t\n\f\r'
    expect(jsonStringifyBuffer(Buffer.from(input, 'utf-8'))).toBe(
      JSON.stringify(input),
    )
  })

  test('uses \\u00XX escapes for other control characters', () => {
    const bytes = Buffer.alloc(0x20)
    for (let i = 0; i < 0x20; i++) bytes[i] = i
    expect(jsonStringifyBuffer(bytes)).toBe(JSON.stringify(bytes.toString()))
  })

  test('passes through non-ASCII UTF-8 sequences unchanged', () => {
    const input = 'café — 漢字 — 🚀 — ñ'
    expect(jsonStringifyBuffer(Buffer.from(input, 'utf-8'))).toBe(
      JSON.stringify(input),
    )
  })

  test('does not escape line/paragraph separators (matches JSON.stringify)', () => {
    const input = 'a b c'
    expect(jsonStringifyBuffer(Buffer.from(input, 'utf-8'))).toBe(
      JSON.stringify(input),
    )
  })

  test('does not escape DEL (0x7F)', () => {
    const input = 'a\x7Fb'
    expect(jsonStringifyBuffer(Buffer.from(input, 'utf-8'))).toBe(
      JSON.stringify(input),
    )
  })

  test('handles long alternating safe and escaped runs', () => {
    const input = 'x\n'.repeat(10_000) + '"foo"\n' + 'y\\z'.repeat(10_000)
    expect(jsonStringifyBuffer(Buffer.from(input, 'utf-8'))).toBe(
      JSON.stringify(input),
    )
  })

  test('handles consecutive escapes with no safe bytes between them', () => {
    const input = '\\\\""\n\n'
    expect(jsonStringifyBuffer(Buffer.from(input, 'utf-8'))).toBe(
      JSON.stringify(input),
    )
  })

  test('regression #22132: amplification stays bounded for newline-heavy text', () => {
    // 1 MiB of `x\n` so 50% newlines: a microcosm of the OOM repro.
    const input = 'x\n'.repeat(524_288)
    const out = jsonStringifyBuffer(Buffer.from(input, 'utf-8'))
    expect(out).toBe(JSON.stringify(input))
    // 1 MiB input → 1.5 MiB output (each `\n` becomes `\\n`); the previous
    // implementation transiently held both the decoded source string and the
    // JSON-encoded copy, doubling peak heap usage for large `?raw` imports.
    expect(out.length).toBe(input.length + input.length / 2 + 2)
  })
})
