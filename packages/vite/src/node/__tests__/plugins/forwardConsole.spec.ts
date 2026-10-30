import { describe, expect, test } from 'vitest'
import { escapeUnsupportedAnsiSequences } from '../../plugins/forwardConsole'

describe('escapeUnsupportedAnsiSequences', () => {
  test('escapes standalone BEL characters', () => {
    expect(escapeUnsupportedAnsiSequences('before\x07middle\x07after')).toBe(
      'before\\x07middle\\x07after',
    )
  })

  test('escapes OSC 52 with a BEL terminator', () => {
    expect(escapeUnsupportedAnsiSequences('\x1b]52;c;Y2xpcGJvYXJk\x07')).toBe(
      '\\x1b]52;c;Y2xpcGJvYXJk\\x07',
    )
  })

  test('escapes OSC 52 with an ST terminator', () => {
    expect(escapeUnsupportedAnsiSequences('\x1b]52;c;Y2xpcGJvYXJk\x1b\\')).toBe(
      '\\x1b]52;c;Y2xpcGJvYXJk\\x1b\\',
    )
  })

  test('escapes C1 CSI screen controls', () => {
    expect(escapeUnsupportedAnsiSequences('\u009b2J\u009bH')).toBe(
      '\\x9b2J\\x9bH',
    )
  })

  test('escapes C1 OSC and ST controls', () => {
    expect(
      escapeUnsupportedAnsiSequences('\u009d52;c;Y2xpcGJvYXJk\u009c'),
    ).toBe('\\x9d52;c;Y2xpcGJvYXJk\\x9c')
  })

  test('escapes the entire C1 control range', () => {
    const controls = Array.from({ length: 32 }, (_, i) =>
      String.fromCharCode(0x80 + i),
    ).join('')

    expect(escapeUnsupportedAnsiSequences(controls)).toBe(
      '\\x80\\x81\\x82\\x83\\x84\\x85\\x86\\x87' +
        '\\x88\\x89\\x8a\\x8b\\x8c\\x8d\\x8e\\x8f' +
        '\\x90\\x91\\x92\\x93\\x94\\x95\\x96\\x97' +
        '\\x98\\x99\\x9a\\x9b\\x9c\\x9d\\x9e\\x9f',
    )
  })

  test('preserves Chrome DevTools SGR syntax', () => {
    const message =
      '\x1b[31mred\x1b[0m \x1b[1;4;93mbold underline\x1b[m ' +
      '\x1b[38;2;255;0;128mRGB\x1b[39m \x1b[48;2;0;128;255mbackground\x1b[49m ' +
      '\x1b[;32;mempty parameters\x1b[;m'

    expect(escapeUnsupportedAnsiSequences(message)).toBe(message)
  })

  test('escapes unsupported and incomplete sequences alongside SGR', () => {
    const message =
      '\x1b]0;title\x07 \x1b[2J\x1b[H \x1b[?25l \x1b[31:1m \x1bc ' +
      '\x1b[31mred\x1b[m \x1b[31 \x1b'
    const escaped =
      '\\x1b]0;title\\x07 \\x1b[2J\\x1b[H \\x1b[?25l \\x1b[31:1m \\x1bc ' +
      '\x1b[31mred\x1b[m \\x1b[31 \\x1b'

    expect(escapeUnsupportedAnsiSequences(message)).toBe(escaped)
  })
})
