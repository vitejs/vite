import { expect, test } from 'vitest'
import { defaultAllowedOrigins } from '../constants'

test('defaultAllowedOrigins', () => {
  const allowed = [
    'http://localhost',
    'http://foo.localhost',
    'http://localhost:3000',
    'https://localhost:3000',
    'http://127.0.0.1',
    'http://[::1]',
    'http://[::1]:3000',
  ]
  const denied = [
    'file:///foo',
    'http://localhost.example.com',
    'http://foo.example.com:localhost',
    'http://',
    'http://192.0.2',
    'http://[2001:db8::1]',
    'http://vite',
    'http://vite:3000',
  ]

  for (const origin of allowed) {
    expect(defaultAllowedOrigins.test(origin), origin).toBe(true)
  }

  for (const origin of denied) {
    expect(defaultAllowedOrigins.test(origin), origin).toBe(false)
  }
})
