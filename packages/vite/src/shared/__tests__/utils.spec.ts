import { describe, expect, test } from 'vitest'
import { decodeSourceURL, encodeSourceURL } from '../utils'

describe('encodeSourceURL / decodeSourceURL', () => {
  test.for([
    '/app/src/main.ts',
    '/app/with space/main.ts',
    '/app/with\ttab/main.ts',
    '/app/with　ideographic space/main.ts',
    '/app/100%/main.ts',
    '/app/my%20dir/main.ts',
    '/app/%E3%80%80/main.ts',
    '/app/a %41/main.ts',
    '\0virtual:foo',
  ])('round-trips %j', (id) => {
    const encoded = encodeSourceURL(id)
    expect(encoded).not.toMatch(/\s/)
    expect(decodeSourceURL(encoded)).toBe(id)
  })
})
