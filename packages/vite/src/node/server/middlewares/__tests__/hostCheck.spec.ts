import { describe, expect, test } from 'vitest'
import {
  getAdditionalAllowedHosts,
  isHostAllowedWithoutCache,
} from '../hostCheck'

test('getAdditionalAllowedHosts', async () => {
  const actual = getAdditionalAllowedHosts(
    {
      host: 'vite.host.example.com',
      hmr: {
        host: 'vite.hmr-host.example.com',
      },
      origin: 'http://vite.origin.example.com:5173',
    },
    {
      host: 'vite.preview-host.example.com',
    },
  ).sort()
  expect(actual).toStrictEqual(
    [
      'vite.host.example.com',
      'vite.hmr-host.example.com',
      'vite.origin.example.com',
      'vite.preview-host.example.com',
    ].sort(),
  )
})

describe('isHostAllowedWithoutCache', () => {
  const allowCases = {
    'IP address': [
      '192.168.0.0',
      '[::1]',
      '127.0.0.1:5173',
      '[2001:db8:0:0:1:0:0:1]:5173',
    ],
    localhost: [
      'localhost',
      'localhost:5173',
      'foo.localhost',
      'foo.bar.localhost',
    ],
    specialProtocols: [
      // for electron browser window (https://github.com/webpack/webpack-dev-server/issues/3821)
      'file:///path/to/file.html',
      // for browser extensions (https://github.com/webpack/webpack-dev-server/issues/3807)
      'chrome-extension://foo',
    ],
  }

  const disallowCases = {
    'IP address': ['255.255.255.256', '[:', '[::z]'],
    localhost: ['localhos', 'localhost.foo'],
    specialProtocols: ['mailto:foo@bar.com'],
    others: [''],
  }

  for (const [name, inputList] of Object.entries(allowCases)) {
    test.each(inputList)(`allows ${name} (%s)`, (input) => {
      const actual = isHostAllowedWithoutCache([], [], input)
      expect(actual).toBe(true)
    })
  }

  for (const [name, inputList] of Object.entries(disallowCases)) {
    test.each(inputList)(`disallows ${name} (%s)`, (input) => {
      const actual = isHostAllowedWithoutCache([], [], input)
      expect(actual).toBe(false)
    })
  }

  test('allows additionalAlloweHosts option', () => {
    const additionalAllowedHosts = ['vite.example.com']
    const actual = isHostAllowedWithoutCache(
      [],
      additionalAllowedHosts,
      'vite.example.com',
    )
    expect(actual).toBe(true)
  })

  test('allows single allowedHosts', () => {
    const cases = {
      allowed: ['example.com'],
      disallowed: ['vite.dev'],
    }
    for (const c of cases.allowed) {
      const actual = isHostAllowedWithoutCache(['example.com'], [], c)
      expect(actual, c).toBe(true)
    }
    for (const c of cases.disallowed) {
      const actual = isHostAllowedWithoutCache(['example.com'], [], c)
      expect(actual, c).toBe(false)
    }
  })

  test('allows all subdomain allowedHosts', () => {
    const cases = {
      allowed: ['example.com', 'foo.example.com', 'foo.bar.example.com'],
      disallowed: ['vite.dev'],
    }
    for (const c of cases.allowed) {
      const actual = isHostAllowedWithoutCache(['.example.com'], [], c)
      expect(actual, c).toBe(true)
    }
    for (const c of cases.disallowed) {
      const actual = isHostAllowedWithoutCache(['.example.com'], [], c)
      expect(actual, c).toBe(false)
    }
  })
})
