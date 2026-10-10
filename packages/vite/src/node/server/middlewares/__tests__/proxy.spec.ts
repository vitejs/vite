import { describe, expect, test } from 'vitest'
import { captureSetCookieValues } from '../proxy'

describe('captureSetCookieValues', () => {
  test('returns the full set-cookie list for a standard Headers instance', () => {
    const headers = new Headers()
    headers.append('Set-Cookie', 'foo=1; Path=/')
    headers.append('Set-Cookie', 'bar=2; Path=/')
    const result = captureSetCookieValues(new Response('', { headers }))
    expect(result).toEqual(['foo=1; Path=/', 'bar=2; Path=/'])
  })

  test('returns undefined for a single set-cookie value', () => {
    const headers = new Headers()
    headers.append('Set-Cookie', 'foo=1; Path=/')
    expect(captureSetCookieValues(new Response('', { headers }))).toBeUndefined()
  })

  test('returns undefined when no set-cookie header is present', () => {
    const headers = new Headers()
    headers.set('Content-Type', 'text/plain')
    expect(captureSetCookieValues(new Response('', { headers }))).toBeUndefined()
  })

  test('falls back to .raw() when getSetCookie is unavailable (node-fetch 2.x)', () => {
    const rawHeaders = {
      'set-cookie': ['foo=1; Path=/', 'bar=2; Path=/'],
      'content-type': ['text/plain'],
    }
    const fakeHeaders = {
      raw: () => rawHeaders,
    } as unknown as Headers
    const response = { headers: fakeHeaders } as Response
    expect(captureSetCookieValues(response)).toEqual([
      'foo=1; Path=/',
      'bar=2; Path=/',
    ])
  })

  test('matches the raw() key case-insensitively', () => {
    const rawHeaders = {
      'Set-Cookie': ['foo=1; Path=/', 'bar=2; Path=/'],
    }
    const fakeHeaders = {
      raw: () => rawHeaders,
    } as unknown as Headers
    expect(captureSetCookieValues({ headers: fakeHeaders } as Response)).toEqual([
      'foo=1; Path=/',
      'bar=2; Path=/',
    ])
  })

  test('returns undefined when .raw() fallback finds only a single value', () => {
    const rawHeaders = { 'set-cookie': ['only=value'] }
    const fakeHeaders = {
      raw: () => rawHeaders,
    } as unknown as Headers
    expect(captureSetCookieValues({ headers: fakeHeaders } as Response)).toBeUndefined()
  })
})
