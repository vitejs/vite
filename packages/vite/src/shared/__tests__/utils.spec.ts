import { describe, expect, test } from 'vitest'
import { NULL_BYTE_PLACEHOLDER, VALID_ID_PREFIX } from '../constants'
import { unwrapId, wrapId } from '../utils'

describe('wrapId', () => {
  test('wraps an unwrapped id', () => {
    expect(wrapId('/foo')).toBe(`${VALID_ID_PREFIX}/foo`)
  })

  test('is a noop for an already wrapped id', () => {
    const wrapped = `${VALID_ID_PREFIX}/foo`
    expect(wrapId(wrapped)).toBe(wrapped)
  })

  test('encodes a leading null byte', () => {
    expect(wrapId('\0virtual')).toBe(
      `${VALID_ID_PREFIX}${NULL_BYTE_PLACEHOLDER}virtual`,
    )
  })

  test('encodes every null byte, not just the first', () => {
    // e.g. a commonjs proxy wrapping a virtual module has multiple null bytes,
    // and the wrapped id must stay free of raw null bytes to be a valid URL
    const id = '\0commonjs-proxy:\0virtual'
    const wrapped = wrapId(id)
    expect(wrapped).not.toContain('\0')
    expect(wrapped).toBe(
      `${VALID_ID_PREFIX}${NULL_BYTE_PLACEHOLDER}commonjs-proxy:${NULL_BYTE_PLACEHOLDER}virtual`,
    )
  })
})

describe('unwrapId', () => {
  test('unwraps a wrapped id', () => {
    expect(unwrapId(`${VALID_ID_PREFIX}/foo`)).toBe('/foo')
  })

  test('is a noop for an already unwrapped id', () => {
    expect(unwrapId('/foo')).toBe('/foo')
  })

  test('decodes every null byte placeholder, not just the first', () => {
    const wrapped = `${VALID_ID_PREFIX}${NULL_BYTE_PLACEHOLDER}commonjs-proxy:${NULL_BYTE_PLACEHOLDER}virtual`
    expect(unwrapId(wrapped)).toBe('\0commonjs-proxy:\0virtual')
  })
})

describe('wrapId/unwrapId', () => {
  test('round-trips an id with multiple null bytes', () => {
    const id = '\0commonjs-proxy:\0virtual'
    expect(unwrapId(wrapId(id))).toBe(id)
  })
})
